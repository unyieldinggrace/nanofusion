import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnounceLeafSendBlocksPhase extends BasePhase {
	constructor(sessionClient, signatureDataCodec, blockBuilder) {
		super();
		this.Name = 'Announce Leaf Send Blocks';
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceLeafSendBlock, this.onPeerAnnouncesLeafSendBlock.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestLeafSendBlocks, this.onPeerRequestsLeafSendBlocks.bind(this));
		this.myPubKeys = [];
		this.foreignPubKeys = [];
		this.myLeafSendBlocks = [];
		this.foreignLeafSendBlocks = [];
		this.leafSendBlockAmounts = {};

		this.latestState = {};
	}

	executeInternal(state) {
		console.log('Mix Phase: Announcing leaf send blocks.');
		this.latestState = state;

		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;
		this.myLeafSendBlocks = state.MyLeafSendBlocks;
		this.leafSendBlockAmounts = state.LeafSendBlockAmounts;

		this.sessionClient.SendEvent(MixEventTypes.RequestLeafSendBlocks, {});
		this.broadcastMyLeafSendBlocks();
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;

		if (this.getNumSendBlocksMatchesNumPubKeys()) {
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesLeafSendBlock(data) {
		let alreadyKnown = false;
		this.foreignLeafSendBlocks.forEach((foreignLeafSendBlock) => {
			let serialisedLocal = JSON.stringify(foreignLeafSendBlock);
			let serialisedForeign = JSON.stringify(data.Data.SendBlock);
			if (serialisedLocal === serialisedForeign) {
				alreadyKnown = true;
				return false;
			}
		});

		if (!alreadyKnown) {
			this.foreignLeafSendBlocks.push(data.Data.SendBlock);
		}

		this.leafSendBlockAmounts[data.Data.SendBlock.hash] = data.Data.Balance;

		this.emitStateUpdate({
			ForeignLeafSendBlocks: this.foreignLeafSendBlocks,
			LeafSendBlockAmounts: this.leafSendBlockAmounts
		});
	}

	onPeerRequestsLeafSendBlocks() {
		this.broadcastMyLeafSendBlocks();
	}

	broadcastMyLeafSendBlocks() {
		this.myLeafSendBlocks.forEach((leafSendBlock) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnounceLeafSendBlock, {
				SendBlock: leafSendBlock,
				Balance: this.latestState.LeafSendBlockAmounts[leafSendBlock.hash]
			});
		});
	}

	getNumSendBlocksMatchesNumPubKeys() {
		let numSendBlocks = this.latestState.MyLeafSendBlocks.length + this.latestState.ForeignLeafSendBlocks.length;
		let numPubKeys = this.latestState.MyPubKeys.length + this.latestState.ForeignPubKeys.length;
		return (numSendBlocks === numPubKeys);
	}
}

export default MixAnnounceLeafSendBlocksPhase;
