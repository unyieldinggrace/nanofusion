import * as blakejs from 'blakejs';
import AccountNode from "./AccountNode";

class AccountTree {
	constructor(signatureDataCodec, blockSigner) {
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;

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
		// figure out a way to print this to the console for inspection.
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

	serialise() {
		return '';
	}

	Digest() {
		blakejs.blake2b(this.serialise());
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
	}

}

export default AccountTree;
