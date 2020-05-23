import BasePhase from "./BasePhase";
import MixEventTypes from "../EventTypes/MixEventTypes";

class MixAnnouncePubKeysPhase extends BasePhase {
	constructor(phaseState, sessionClient) {
		super(phaseState);
		this.sessionClient = sessionClient;
		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnouncePubKey, this.onPeerAnnouncesPubKey.bind(this));
		this.isComplete = false;
	}

	Execute() {
		this.phaseState.PubKeys.forEach((pubKeyHex) => {
			this.sessionClient.SendEvent(MixEventTypes.AnnouncePubKey, {
				PubKey: pubKeyHex
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

	onPeerAnnouncesPubKey(data) {
		let pubKeys = this.phaseState.PubKeys;
		pubKeys.push(data.Data.PubKey)

		this.updatePhaseState({
			PubKeys: pubKeys
		});
	}
}

export default MixAnnouncePubKeysPhase;
