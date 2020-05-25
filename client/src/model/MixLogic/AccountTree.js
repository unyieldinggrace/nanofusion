import * as blakejs from 'blakejs';
import AccountNode from "./AccountNode";

class AccountTree {
	constructor() {
		this.pubKeys = null;
		this.MixNode = null;
		this.LeafNodes = [];
	}

	SetPubKeys(pubKeys) {
		this.pubKeys = pubKeys;
		let leftPubKeyOfLeafNode = null;
		let rightPubKeyOfLeafNode = null;

		for (let i = 0; i < this.pubKeys.length; i++) {
			if (i % 2 === 0) {
				leftPubKeyOfLeafNode = this.pubKeys[i];
			} else {
				rightPubKeyOfLeafNode = this.pubKeys[i];
				this.LeafNodes.push(this.createAccountNode([leftPubKeyOfLeafNode, rightPubKeyOfLeafNode]));
				leftPubKeyOfLeafNode = null;
				rightPubKeyOfLeafNode = null;
			}
		}

		if (leftPubKeyOfLeafNode) {
			this.LeafNodes.push(this.createAccountNode(leftPubKeyOfLeafNode));
		}
	}

	GetReceivingNanoAccountForPublicKeyHex(publicKeyHex) {

	}

	Serialise() {

	}

	Digest() {
		blakejs.blake2b(this.Serialise());
	}

	createAccountNode(componentPublicKeys) {
		return new AccountNode(componentPublicKeys);
	}

}

export default AccountTree;
