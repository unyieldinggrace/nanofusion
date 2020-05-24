import PhaseTracker from "./PhaseTracker";
import MixAnnouncePubKeysPhase from "./MixAnnouncePubKeysPhase";
import MixAnnounceOutputsPhase from "./MixAnnounceOutputsPhase";

class MixPhaseFactory {
	constructor(sessionClient) {
		this.sessionClient = sessionClient;
	}

	BuildPhaseTracker() {
		let phaseTracker = new PhaseTracker();
		let announcePubKeysPhase = new MixAnnouncePubKeysPhase(this.sessionClient);
		let announceOutputsPhase = new MixAnnounceOutputsPhase(this.sessionClient);

		phaseTracker.AddPhase(announcePubKeysPhase);
	}
}

export default MixPhaseFactory;
