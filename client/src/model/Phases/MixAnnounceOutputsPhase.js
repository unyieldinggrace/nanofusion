import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnounceOutputsPhase extends BasePhase {
	constructor(sessionClient) {
		super();
		this.Name = 'Announce Outputs';
		this.sessionClient = sessionClient;
		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceOutput, this.onPeerAnnouncesOutput.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestOutputs, this.onPeerRequestsOutputs.bind(this));
		this.myOutputAccounts = null;
		this.foreignOutputAccounts = [];
		this.myLeafSendBlocks = null;
		this.foreignLeafSendBlocks = null;

		this.latestState = {};
	}

	executeInternal(state) {
		console.log('Mix Phase: Announcing outputs.');
		this.latestState = state;

		this.myOutputAccounts = state.MyOutputAccounts;
		this.myLeafSendBlocks = state.MyLeafSendBlocks;
		this.foreignLeafSendBlocks = state.ForeignLeafSendBlocks;

		this.sessionClient.SendEvent(MixEventTypes.RequestOutputs, {});
		this.broadcastMyOutputAccounts();
	}

	onPeerAnnouncesOutput(data) {
		let alreadyKnown = false;
		this.foreignOutputAccounts.forEach((foreignOutputAccount) => {
			if (data.Data.NanoAddress === foreignOutputAccount.NanoAddress) {
				alreadyKnown = true;
				return false;
			}
		});

		if (!alreadyKnown) {
			this.foreignOutputAccounts.push({
				NanoAddress: data.Data.NanoAddress,
				Amount: data.Data.Amount
			});
		}

		this.emitStateUpdate({
			ForeignOutputAccounts: this.foreignOutputAccounts
		});

		if (this.getOutputTotalMatchesInputTotal()) {
			this.markPhaseCompleted();
		}
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;

		if (this.getOutputTotalMatchesInputTotal()) {
			this.markPhaseCompleted();
		}
	}

	broadcastMyOutputAccounts() {
		this.myOutputAccounts.forEach((outputAccount) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnounceOutput, {
				NanoAddress: outputAccount.NanoAddress,
				Amount: outputAccount.Amount
			});
		});
	}

	onPeerRequestsOutputs() {
		// potential timing attack here (although unlikely, since it all goes through a central server).
		// consider adding a short, random-length delay.
		this.broadcastMyOutputAccounts();
	}

	getOutputTotalMatchesInputTotal() {
		// this bit next!
	}

}

export default MixAnnounceOutputsPhase;
