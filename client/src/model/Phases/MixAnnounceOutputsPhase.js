import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnounceOutputsPhase extends BasePhase {
	constructor(sessionClient) {
		super();
		this.sessionClient = sessionClient;
		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceOutput, this.onPeerAnnouncesOutput.bind(this));
		this.myOutputAccounts = null;
		this.foreignOutputAccounts = [];
		this.myLeafSendBlocks = null;
		this.foreignLeafSendBlocks = null;
	}

	executeInternal(state) {
		this.myOutputAccounts = state.MyOutputAccounts;
		this.myLeafSendBlocks = state.MyLeafSendBlocks;
		this.foreignLeafSendBlocks = state.ForeignLeafSendBlocks;

		Object.keys(state.MyOutputAccounts).forEach((outputAccount) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnounceOutput, {
				NanoAddress: outputAccount.NanoAddress,
				Amount: outputAccount.Amount
			});
		});
	}

	onPeerAnnouncesOutput(data) {
		this.foreignOutputAccounts.push({
			NanoAddress: data.Data.NanoAddress,
			Amount: data.Data.Amount
		});

		this.emitStateUpdate({
			ForeignOutputAccounts: this.foreignOutputAccounts
		});

		if (this.getOutputTotalMatchesInputTotal()) {
			this.markPhaseCompleted();
		}
	}

	getOutputTotalMatchesInputTotal() {
		return false;
	}
}

export default MixAnnounceOutputsPhase;
