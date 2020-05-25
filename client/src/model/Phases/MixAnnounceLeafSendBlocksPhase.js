import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnounceLeafSendBlocksPhase extends BasePhase {
	constructor(sessionClient, signatureDataCodec, blockBuilder) {
		super();
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceLeafSendBlock, this.onPeerAnnouncesLeafSendBlock.bind(this));
		this.myLeafSendBlocks = [];
		this.foreignLeafSendBlocks = [];
		this.foreignPubKeys = [];
	}

	executeInternal(state) {
		this.foreignPubKeys = state.ForeignPubKeys;
		this.myLeafSendBlocks = state.MyLeafSendBlocks;

		this.myLeafSendBlocks.forEach((leafSendBlock) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnounceLeafSendBlock, {
				PubKey: leafSendBlock.PublicKeyHex,
				SendBlock: leafSendBlock.Block,
				Signature: this.getSignature(leafSendBlock.PrivateKeyHex, leafSendBlock.Block),
			});
		});
	}

	async NotifyOfUpdatedState(state) {
		if (this.getNumSendBlocksMatchesNumPubKeys()) {
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesLeafSendBlock(data) {
		if (this.myLeafSendBlocks.indexOf(data.Data.PubKey) !== -1) {
			return;
		}

		this.foreignLeafSendBlocks.push(data.Data.PubKey);

		this.emitStateUpdate({
			ForeignLeafSendBlocks: this.foreignLeafSendBlocks
		});
	}

	getNumSendBlocksMatchesNumPubKeys() {
		return false;
	}
}

export default MixAnnounceLeafSendBlocksPhase;
