import * as blakejs from 'blakejs';
import AccountNode from "./AccountNode";
import NanoAmountConverter from "../Cryptography/NanoAmountConverter";

class AccountTree {
	constructor(signatureDataCodec, blockSigner, blockBuilder) {
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
		this.blockBuilder = blockBuilder;

		this.inputPubKeys = null;
		this.MixNode = null;
		this.LeafNodes = [];
		this.NonLeafNodesByLayer = [];
		this.OutputAccounts = [];
	}

	SetInputPubKeysHex(pubKeys) {
		this.inputPubKeys = pubKeys;
		let leftPubKeyOfLeafNode = null;
		let rightPubKeyOfLeafNode = null;

		for (let i = 0; i < this.inputPubKeys.length; i++) {
			if (i % 2 === 0) {
				leftPubKeyOfLeafNode = this.inputPubKeys[i];
			} else {
				rightPubKeyOfLeafNode = this.inputPubKeys[i];
				this.LeafNodes.push(this.createLeafAccountNode([leftPubKeyOfLeafNode, rightPubKeyOfLeafNode]));
				leftPubKeyOfLeafNode = null;
				rightPubKeyOfLeafNode = null;
			}
		}

		if (leftPubKeyOfLeafNode) {
			this.LeafNodes.push(this.createLeafAccountNode([leftPubKeyOfLeafNode]));
		}
	}

	SetOutputAccounts(outputAccounts) {
		this.OutputAccounts = outputAccounts;

		let branchLayerNodes = this.LeafNodes;

		while (branchLayerNodes.length > 1) {
			branchLayerNodes = this.addAccountNodeLayer(branchLayerNodes);
		}

		this.MixNode = branchLayerNodes[0];

		this.buildTransactionPaths(this.MixNode, this.OutputAccounts);
	}

	addAccountNodeLayer(branchLayerNodes) {
		let nodeLayer = [];
		let leftAccountNode = null;
		let rightAccountNode = null;

		for (let i = 0; i < branchLayerNodes.length; i++) {
			if (i % 2 === 0) {
				leftAccountNode = branchLayerNodes[i];
			} else {
				rightAccountNode = branchLayerNodes[i];
				nodeLayer.push(this.createAccountNode([leftAccountNode, rightAccountNode]));
				leftAccountNode = null;
				rightAccountNode = null;
			}
		}

		if (leftAccountNode) {
			nodeLayer.push(this.createAccountNode([leftAccountNode]));
		}

		this.NonLeafNodesByLayer.push(nodeLayer);
		return nodeLayer;
	}

	GetLeafAccountNodeForPublicKeyHex(publicKeyHex) {
		let result = null;

		this.LeafNodes.forEach((leafNode) => {
			if (leafNode.GetComponentPublicKeysHex().indexOf(publicKeyHex) !== -1) {
				result = leafNode;
				return false;
			}
		});

		return result;
	}

	GetTreeDump() {
		let addBranchNodes = (parentObject, node) => {
			parentObject.left = node.AccountNodeLeft ? { node: node.AccountNodeLeft } : null;
			parentObject.right = node.AccountNodeRight ? { node: node.AccountNodeRight } : null;

			if (parentObject.left) {
				addBranchNodes(parentObject.left, node.AccountNodeLeft);
			}

			if (parentObject.right) {
				addBranchNodes(parentObject.right, node.AccountNodeRight);
			}
		};

		let rootNodeObject = {node: this.MixNode};
		addBranchNodes(rootNodeObject, this.MixNode);

		return rootNodeObject;

		// let serialised = {
		// 	'node': 1,
		// 	'left': {
		// 		'node': 2,
		// 		'left': {
		// 			'node': 3
		// 		},
		// 		'right': {
		// 			'node': 4
		// 		}
		// 	},
		// 	'right': {
		// 		'node': 5,
		// 		'left': {
		// 			'node': 6
		// 		},
		// 		'right': {
		// 			'node': 7
		// 		}
		// 	}
		// };
	}

	Digest() {
		if (!this.MixNode) {
			return null;
		}

		let string = JSON.stringify(this.GetTreeDump());
		let bytes = (new TextEncoder()).encode(string);
		return blakejs.blake2b(bytes);
	}

	createLeafAccountNode(componentPublicKeysHex) {
		let componentPublicKeys = componentPublicKeysHex.map((pubKeyHex) => {
			return this.signatureDataCodec.DecodePublicKey(pubKeyHex);
		});

		let aggregatedNanoAddress = this.blockSigner.GetNanoAddressForAggregatedPublicKey(componentPublicKeys);

		return new AccountNode(componentPublicKeysHex, aggregatedNanoAddress);
	}

	createAccountNode(branchNodes) {
		let componentPublicKeys = [];
		let componentPublicKeysHex = [];

		branchNodes.forEach((branchNode) => {
			branchNode.GetComponentPublicKeysHex().forEach((publicKeyHex) => {
				componentPublicKeys.push(this.signatureDataCodec.DecodePublicKey(publicKeyHex));
				componentPublicKeysHex.push(publicKeyHex);
			});
		});

		let aggregatedNanoAddress = this.blockSigner.GetNanoAddressForAggregatedPublicKey(componentPublicKeys);
		let node = new AccountNode(componentPublicKeysHex, aggregatedNanoAddress);

		node.AccountNodeLeft = branchNodes[0];
		if (branchNodes.length === 2) {
			node.AccountNodeRight = branchNodes[1];
		}

		return node;
	}

	buildTransactionPaths(accountNode, outputAccounts) {
		if (accountNode.IsLeafNode()) {
			this.buildTransactionPathsForLeafNode(accountNode, outputAccounts);
			return;
		}

		let lastSuccessPathBlock = null;
		[accountNode.AccountNodeLeft, accountNode.AccountNodeRight].forEach((branchNode) => {
			if (!branchNode) {
				return true;
			}

			if (!branchNode.GetSuccessPathSendBlock(accountNode.NanoAddress)) {
				this.buildTransactionPaths(branchNode, [
					{
						NanoAddress: accountNode.NanoAddress,
						//
						//	TODO: Looks like MixAccountRaw isn't ready to be used at this point. It isn't filled out
						//	 until later. Probably better to fill it out in an earlier phase. Best guess, after
						//	 leaf-send blocks are announced.
						//
						Amount: NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(accountNode.MixAmountRaw)
					}
				]);
			}

			let incomingSendBlock = branchNode.GetSuccessPathSendBlock(accountNode.NanoAddress);

			lastSuccessPathBlock = this.blockBuilder.GetUnsignedReceiveBlock(
				accountNode.NanoAddress,
				lastSuccessPathBlock ? lastSuccessPathBlock.hash : null,
				this.blockBuilder.DefaultRepNodeAddress,
				branchNode.MixAmountRaw,
				incomingSendBlock.hash
			);

			accountNode.MixAmountRaw = NanoAmountConverter.prototype.AddRawAmounts(accountNode.MixAmountRaw, branchNode.MixAmountRaw);
			accountNode.TransactionPaths.Success.push(lastSuccessPathBlock);
		});

		this.buildTransactionPathsForOutputs(outputAccounts, lastSuccessPathBlock, accountNode);
	}

	buildTransactionPathsForOutputs(outputAccounts, lastSuccessPathBlock, accountNode) {
		let accountBalance = accountNode.MixAmountRaw;

		outputAccounts.forEach((outputAccount) => {
			let sendAmountInRaw = NanoAmountConverter.prototype.ConvertNanoAmountToRawAmount(outputAccount.Amount);
			accountBalance = NanoAmountConverter.prototype.SubtractSendAmount(accountBalance, sendAmountInRaw);

			lastSuccessPathBlock = this.blockBuilder.GetUnsignedSendBlock(
				accountNode.NanoAddress,
				lastSuccessPathBlock.hash,
				this.blockBuilder.DefaultRepNodeAddress,
				accountBalance,
				outputAccount.NanoAddress
			);

			accountNode.TransactionPaths.Success.push(lastSuccessPathBlock);
		});
	}

	buildTransactionPathsForLeafNode(accountNode, outputAccounts) {
		let lastSuccessPathBlock = null;
		accountNode.IncomingLeafSendBlocks.forEach((leafSendBlock) => {
			lastSuccessPathBlock = this.blockBuilder.GetUnsignedReceiveBlock(
				accountNode.NanoAddress,
				lastSuccessPathBlock ? lastSuccessPathBlock.hash : null,
				this.blockBuilder.DefaultRepNodeAddress,
				leafSendBlock.AmountRaw,
				leafSendBlock.Block.hash
			);

			accountNode.MixAmountRaw = NanoAmountConverter.prototype.AddRawAmounts(accountNode.MixAmountRaw, leafSendBlock.AmountRaw);
			accountNode.TransactionPaths.Success.push(lastSuccessPathBlock);
		});

		this.buildTransactionPathsForOutputs(outputAccounts, lastSuccessPathBlock, accountNode);
	}

}

export default AccountTree;
