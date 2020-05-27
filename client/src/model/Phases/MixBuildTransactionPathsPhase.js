import BasePhase from "./BasePhase";
import AccountTree from "../MixLogic/AccountTree";

class MixBuildTransactionPathsPhase extends BasePhase {
	constructor(blockBuilder) {
		super();
		this.Name = 'Build Transaction Paths';
		this.blockBuilder = blockBuilder;

		this.accountTree = null;
	}

	executeInternal(state) {
		console.log('Mix Phase: Building transaction paths.');
		this.accountTree = state.AccountTree;

		this.buildAccountTreeNodes();

		this.emitStateUpdate({
			AccountTree: this.accountTree
		});
	}

	async NotifyOfUpdatedState(state) {
		if (!!state.AccountTree) {
			this.markPhaseCompleted();
		}
	}

	buildAccountTreeNodes() {
		this.accountTree.BuildNodes();
	}

}

export default MixBuildTransactionPathsPhase;
