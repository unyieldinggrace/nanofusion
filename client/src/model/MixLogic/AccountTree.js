import * as blakejs from 'blakejs';
import AccountNode from "./AccountNode";

class AccountTree {
	constructor(signatureDataCodec, blockSigner) {
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;

		this.inputPubKeys = null;
		this.MixNode = null;
		this.LeafNodes = [];
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
				this.LeafNodes.push(this.createAccountNode([leftPubKeyOfLeafNode, rightPubKeyOfLeafNode]));
				leftPubKeyOfLeafNode = null;
				rightPubKeyOfLeafNode = null;
			}
		}

		if (leftPubKeyOfLeafNode) {
			this.LeafNodes.push(this.createAccountNode([leftPubKeyOfLeafNode]));
		}
	}

	GetLeafAccountNodeForPublicKeyHex(publicKeyHex) {
		let result = null;

		this.LeafNodes.forEach((leafNode) => {
			if (leafNode.GetComponentPublicKeys().indexOf(publicKeyHex) !== -1) {
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

	createAccountNode(componentPublicKeysHex) {
		let componentPublicKeys = componentPublicKeysHex.map((pubKeyHex) => {
			return this.signatureDataCodec.DecodePublicKey(pubKeyHex);
		});

		let aggregatedNanoAddress = this.blockSigner.GetNanoAddressForAggregatedPublicKey(componentPublicKeys);

		return new AccountNode(componentPublicKeysHex, aggregatedNanoAddress);
	}

}

export default AccountTree;
