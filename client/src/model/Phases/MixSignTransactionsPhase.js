import BasePhase from "./BasePhase";

class MixSignTransactionsPhase extends BasePhase {
	constructor(signTransactionPhaseFactory, signatureDataCodec) {
		super();
		this.Name = 'Signing Transactions';
		this.signTransactionPhaseFactory = signTransactionPhaseFactory;
		this.signatureDataCodec = signatureDataCodec;
		this.latestState = null;
		this.transactionPhaseTrackers = [];
	}

	executeInternal(state) {
		this.latestState = state;
		console.log('Mix Phase: Signing transactions.');
		let transactionsToInitiate = this.getAllTransactionsInTree(this.latestState.AccountTree.MixNode);

		transactionsToInitiate.forEach((transaction) => {
			let phaseTracker = this.signTransactionPhaseFactory.BuildPhaseTracker(transaction.hash);
			phaseTracker.SetStateUpdateEmittedCallback(this.onSignTransactionPhaseTrackerEmittedState.bind(this));

			this.transactionPhaseTrackers.push(phaseTracker);

			phaseTracker.ExecutePhases(this.latestState);
		});

		this.emitStateUpdate({
			TransactionsToSign: this.transactionPhaseTrackers.length
		});
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;
		this.transactionPhaseTrackers.forEach((phaseTracker) => {
			phaseTracker.NotifyOfUpdatedState(this.latestState);
		});

		if (!this.IsRunning()) {
			return;
		}

		if (this.transactionPhaseTrackers.length === 0) {
			return;
		}

		if (this.transactionPhaseTrackers.length === Object.keys(this.latestState.SignatureComponentStore.GetAllJointSignaturesForHashes()).length) {
			this.markPhaseCompleted();
		}
	}

	onSignTransactionPhaseTrackerEmittedState(state) {
		this.emitStateUpdate(state);
	}

	getAllTransactionsInTree(accountNode) {
		if (!accountNode) {
			return [];
		}

		let leftTransactions = this.getAllTransactionsInTree(accountNode.AccountNodeLeft);
		let rightTransactions = this.getAllTransactionsInTree(accountNode.AccountNodeRight);

		// let pubKeysForNode = accountNode.GetComponentPublicKeysHex();
		// pubKeysForNode.sort((a, b) => {
		// 	return a.localeCompare(b);
		// });

		// let myPubKeysHex = this.latestState.MyPubKeys.map((pubKey) => {
		// 	return this.signatureDataCodec.EncodePublicKey(pubKey);
		// });

		// if (myPubKeysHex.indexOf(pubKeysForNode[0]) === -1) {
		// 	return leftTransactions.concat(rightTransactions);
		// }

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
