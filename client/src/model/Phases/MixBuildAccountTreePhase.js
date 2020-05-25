import BasePhase from "./BasePhase";

class MixBuildAccountTreePhase extends BasePhase {
	constructor(signatureDataCodec) {
		super();
		this.signatureDataCodec = signatureDataCodec;

		this.foreignPubKeys = [];
		this.myPubKeys = [];
	}

	executeInternal(state) {
		console.log('Mix Phase: Building account tree.');
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;

		let accountTree = this.buildAccountTree();
		this.emitStateUpdate({
			AccountTree: accountTree
		})
	}

	buildAccountTree() {
		let sortedUniquePubKeys = this.getSortedUniquePubKeys();
	}

	getSortedUniquePubKeys() {
		let myPubKeysHex = this.myPubKeys.map((pubKey) => {
			return this.signatureDataCodec.EncodePublicKey(pubKey);
		});

		let foreignPubKeysHex = this.foreignPubKeys.map((pubKey) => {
			return this.signatureDataCodec.EncodePublicKey(pubKey);
		});

		return this.normaliseArray(myPubKeysHex.concat(foreignPubKeysHex));
	}

	normaliseArray(array) {
		let unique = array.filter((element, index) => {
			return (array.indexOf(element) === index);
		});

		unique.sort();
		return unique;
	}
}

export default MixBuildAccountTreePhase;
