import BasePhase from "./BasePhase";
import AccountTree from "../MixLogic/AccountTree";

class MixBuildAccountTreePhase extends BasePhase {
	constructor(signatureDataCodec, blockSigner, blockBuilder) {
		super();
		this.Name = 'Build Account Tree';
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
		this.blockBuilder = blockBuilder;

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
		});
	}

	async NotifyOfUpdatedState(state) {
		if (!!state.AccountTree) {
			this.markPhaseCompleted();
		}
	}

	buildAccountTree() {
		let sortedUniquePubKeys = this.getSortedUniquePubKeys();
		let accountTree = new AccountTree(this.signatureDataCodec, this.blockSigner, this.blockBuilder);
		accountTree.SetInputPubKeysHex(sortedUniquePubKeys);
		return accountTree;
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
