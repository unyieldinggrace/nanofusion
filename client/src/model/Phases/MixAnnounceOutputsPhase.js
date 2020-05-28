import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";
import NanoAmountConverter from "../Cryptography/NanoAmountConverter";

class MixAnnounceOutputsPhase extends BasePhase {
	constructor(sessionClient) {
		super();
		this.Name = 'Announce Outputs';
		this.sessionClient = sessionClient;
		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceOutput, this.onPeerAnnouncesOutput.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestOutputs, this.onPeerRequestsOutputs.bind(this));
		this.myOutputAccounts = null;
		this.foreignOutputAccounts = [];

		this.latestState = {};
	}

	executeInternal(state) {
		console.log('Mix Phase: Announcing outputs.');
		this.latestState = state;

		this.myOutputAccounts = state.MyOutputAccounts;

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
			console.log('Announce outputs completed (1).');
			this.markPhaseCompleted();
		}
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;

		if (this.getOutputTotalMatchesInputTotal()) {
			console.log('Announce outputs completed (2).');
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
		if (!this.IsRunning()) {
			return false;
		}

		let allLeafSendBlocks = this.latestState.MyLeafSendBlocks.concat(this.latestState.ForeignLeafSendBlocks);
		let allOutputs = this.latestState.MyOutputAccounts.concat(this.latestState.ForeignOutputAccounts);

		let sumLeafSendBlocks = '0';
		let sumOutputs = '0';

		allLeafSendBlocks.forEach((leafSendBlock) => {
			sumLeafSendBlocks = NanoAmountConverter.prototype.AddRawAmounts(
				sumLeafSendBlocks,
				this.latestState.LeafSendBlockAmounts[leafSendBlock.hash]
			);
		});

		allOutputs.forEach((output) => {
			sumOutputs = NanoAmountConverter.prototype.AddRawAmounts(
				sumOutputs,
				NanoAmountConverter.prototype.ConvertNanoAmountToRawAmount(output.Amount)
			);
		});

		// console.log('Outputs calculation:');
		// console.log(allLeafSendBlocks);
		// console.log(sumLeafSendBlocks);
		// console.log(NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(sumLeafSendBlocks));
		// console.log(allOutputs);
		// console.log(sumOutputs);
		// console.log(NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(sumOutputs));

		return (sumLeafSendBlocks === sumOutputs);
	}

}

export default MixAnnounceOutputsPhase;
