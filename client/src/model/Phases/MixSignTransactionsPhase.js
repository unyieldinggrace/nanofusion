import BasePhase from "./BasePhase";

class MixSignTransactionsPhase extends BasePhase {
	constructor(signTransactionPhaseFactory) {
		super();
		this.Name = 'Signing Transactions';
		this.signTransactionPhaseFactory = signTransactionPhaseFactory;
		this.latestState = null;
		this.transactionPhaseTrackers = [];
	}

	executeInternal(state) {
		this.latestState = state;
		console.log('Mix Phase: Signing transactions.');
		let transactionsToInitiate = this.getTransactionsWhereFirstPubKeyOnAccountIsMine(this.latestState.MixNode);

		transactionsToInitiate.forEach((transaction) => {
			let phaseTracker = this.signTransactionPhaseFactory.BuildPhaseTracker(transaction.hash);
			phaseTracker.SetStateUpdateEmittedCallback(this.onSignTransactionPhaseTrackerEmittedState.bind(this));

			this.transactionPhaseTrackers.push(phaseTracker);

			phaseTracker.ExecutePhases(this.latestState);
		});
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;
		this.transactionPhaseTrackers.forEach((phaseTracker) => {
			phaseTracker.NotifyOfUpdatedState(this.latestState);
		});
	}

	onSignTransactionPhaseTrackerEmittedState(state) {
		this.emitStateUpdate(state);
	}

	getTransactionsWhereFirstPubKeyOnAccountIsMine(accountNode) {
		if (!accountNode) {
			return [];
		}

		let leftTransactions = this.getTransactionsWhereFirstPubKeyOnAccountIsMine(accountNode.AccountNodeLeft);
		let rightTransactions = this.getTransactionsWhereFirstPubKeyOnAccountIsMine(accountNode.AccountNodeRight);

		let pubKeysForNode = accountNode.GetComponentPublicKeysHex();
		pubKeysForNode.sort((a, b) => {
			return a.localeCompare(b);
		});

		if (this.latestState.MyPubKeys.indexOf(pubKeysForNode[0]) === -1) {
			return leftTransactions.concat(rightTransactions);
		}

		let selfTransactions = [];
		Object.keys(accountNode.TransactionPaths).forEach((key) => {
			accountNode.TransactionPaths[key].forEach((transaction) => {
				selfTransactions.push(transaction);
			});
		});

		return leftTransactions.concat(rightTransactions).concat(selfTransactions);
	}

}

export default MixSignTransactionsPhase;
