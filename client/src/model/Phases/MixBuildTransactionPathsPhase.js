import BasePhase from "./BasePhase";
import AccountTree from "../MixLogic/AccountTree";

class MixBuildTransactionPathsPhase extends BasePhase {
	constructor(blockBuilder) {
		super();
		this.Name = 'Build Transaction Paths';
		this.blockBuilder = blockBuilder;

		this.accountTree = null;
		this.outputAccounts = null;
	}

	executeInternal(state) {
		console.log('Mix Phase: Building transaction paths.');
		this.accountTree = state.AccountTree;
		this.outputAccounts = state.MyOutputAccounts.concat(state.ForeignOutputAccounts);
		this.outputAccounts.sort((a, b) => {
			return a.NanoAddress.localeCompare(b.NanoAddress);
		});

		this.accountTree.SetOutputAccounts(this.outputAccounts);

		console.log('Tree Dump:');
		console.log(this.accountTree.GetTreeDump());

		this.emitStateUpdate({
			AccountTree: this.accountTree
		});
	}

	async NotifyOfUpdatedState(state) {
		if (!!state.AccountTree && !!state.AccountTree.Digest()) {
			this.markPhaseCompleted();
		}
	}

}

export default MixBuildTransactionPathsPhase;
