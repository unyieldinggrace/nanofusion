import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnounceOutputs extends BasePhase {
	constructor(phaseState, sessionClient) {
		super(phaseState);
		this.sessionClient = sessionClient;
		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceOutput, this.onPeerAnnouncesOutput.bind(this));
		this.isComplete = false;
	}

	Execute() {
		Object.keys(this.phaseState.Outputs).forEach((nanoAddress) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnounceOutput, {
				NanoAddress: nanoAddress,
				Amount: this.phaseState.Outputs[nanoAddress]
			});
		});

		this.signalCompleted();
	}

	IsComplete() {
		return this.isComplete;
	}

	MarkComplete() {
		this.isComplete = true;
	}

	onPeerAnnouncesOutput(data) {
		let outputs = this.phaseState.Outputs;
		outputs[data.Data.NanoAddress] = data.Data.Amount;

		this.updatePhaseState({
			Outputs: outputs
		});
	}
}

export default MixAnnounceOutputs;
