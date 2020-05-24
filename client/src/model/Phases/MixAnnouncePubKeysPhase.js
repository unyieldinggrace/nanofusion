import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnouncePubKeysPhase extends BasePhase {
	constructor(sessionClient) {
		super();
		this.sessionClient = sessionClient;
		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnouncePubKey, this.onPeerAnnouncesPubKey.bind(this));
		this.foreignPubKeys = [];
		this.myPubKeys = [];
	}

	executeInternal(state) {
		this.myPubKeys = state.MyPubKeys;

		state.MyPubKeys.forEach((pubKeyHex) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnouncePubKey, {
				PubKey: pubKeyHex
			});
		});
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
}

export default MixAnnouncePubKeysPhase;
