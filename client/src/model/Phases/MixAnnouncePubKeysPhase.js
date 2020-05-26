import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnouncePubKeysPhase extends BasePhase {
	constructor(sessionClient, signatureDataCodec) {
		super();
		this.Name = 'Announce Pub Keys';
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
		let alreadyKnown = false;
		this.foreignPubKeys.forEach((foreignPubKey) => {
			let foreignPubKeyHex = this.signatureDataCodec.EncodePublicKey(foreignPubKey);
			if (data.Data.PubKey === foreignPubKeyHex) {
				alreadyKnown = true;
				return false;
			}
		});

		if (!alreadyKnown) {
			this.foreignPubKeys.push(this.signatureDataCodec.DecodePublicKey(data.Data.PubKey));
		}

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
