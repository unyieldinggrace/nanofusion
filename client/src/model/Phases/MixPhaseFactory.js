import PhaseTracker from "./PhaseTracker";
import MixAnnouncePubKeysPhase from "./MixAnnouncePubKeysPhase";
import MixAnnounceOutputsPhase from "./MixAnnounceOutputsPhase";
import MixAnnounceLeafSendBlocksPhase from "./MixAnnounceLeafSendBlocksPhase";

class MixPhaseFactory {
	constructor(sessionClient) {
		this.sessionClient = sessionClient;
	}

	BuildPhaseTracker() {
		let phaseTracker = new PhaseTracker();
		let announcePubKeysPhase = new MixAnnouncePubKeysPhase(this.sessionClient);

		let announceLeafSendBlocksPhase = new MixAnnounceLeafSendBlocksPhase(this.sessionClient);
		announceLeafSendBlocksPhase.SetPrerequisitePhases([announcePubKeysPhase]);

		let announceOutputsPhase = new MixAnnounceOutputsPhase(this.sessionClient);
		announceOutputsPhase.SetPrerequisitePhases([announceLeafSendBlocksPhase]);


		phaseTracker.AddPhase(announcePubKeysPhase);
		phaseTracker.AddPhase(announceLeafSendBlocksPhase);
		phaseTracker.AddPhase(announceOutputsPhase);

		return phaseTracker;
	}
}

export default MixPhaseFactory;
