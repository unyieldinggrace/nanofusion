import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnouncePubKeysPhase extends BasePhase {
	constructor(sessionClient, signatureDataCodec) {
		super();
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnouncePubKey, this.onPeerAnnouncesPubKey.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestPubKeys, this.onPeerRequestsPubKeys.bind(this));
		this.foreignPubKeys = [];
		this.myPubKeys = [];
	}

	executeInternal(state) {
		console.log('Mix Phase: Announcing public keys.');
		this.myPubKeys = state.MyPubKeys;

		this.sessionClient.SendEvent(MixEventTypes.RequestPubKeys, {});
		this.broadcastMyPubKeys();
	}

	async NotifyOfUpdatedState(state) {
		if (state.PubKeyListFinalised) {
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesPubKey(data) {
		if (this.myPubKeys.indexOf(data.Data.PubKey) !== -1) {
			return;
		}

		this.foreignPubKeys.push(data.Data.PubKey);

		this.emitStateUpdate({
			ForeignPubKeys: this.foreignPubKeys
		});
	}

	onPeerRequestsPubKeys() {
		this.broadcastMyPubKeys();
	}

	broadcastMyPubKeys() {
		this.myPubKeys.forEach((pubKeyPoint) => {
			console.log('Broadcasting PubKey: '+this.signatureDataCodec.EncodePublicKey(pubKeyPoint));

			this.sessionClient.SendEvent(MixEventTypes.AnnouncePubKey, {
				PubKey: this.signatureDataCodec.EncodePublicKey(pubKeyPoint)
			});
		});
	}
}

export default MixAnnouncePubKeysPhase;
