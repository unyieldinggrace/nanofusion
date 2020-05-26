import PhaseTracker from "./PhaseTracker";
import MixAnnouncePubKeysPhase from "./MixAnnouncePubKeysPhase";
import MixAnnounceOutputsPhase from "./MixAnnounceOutputsPhase";
import MixAnnounceLeafSendBlocksPhase from "./MixAnnounceLeafSendBlocksPhase";
import MixBuildAccountTreePhase from "./MixBuildAccountTreePhase";

class MixPhaseFactory {
	constructor(sessionClient, signatureDataCodec, blockBuilder, blockSigner) {
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;
		this.blockSigner = blockSigner;
	}

	BuildPhaseTracker() {
		let phaseTracker = new PhaseTracker();
		let announcePubKeysPhase = new MixAnnouncePubKeysPhase(this.sessionClient, this.signatureDataCodec);

		let buildAccountTreePhase = new MixBuildAccountTreePhase(this.signatureDataCodec, this.blockSigner);
		buildAccountTreePhase.SetPrerequisitePhases([announcePubKeysPhase]);

		let announceLeafSendBlocksPhase = new MixAnnounceLeafSendBlocksPhase(this.sessionClient, this.signatureDataCodec, this.blockBuilder);
		announceLeafSendBlocksPhase.SetPrerequisitePhases([buildAccountTreePhase]);

		let announceOutputsPhase = new MixAnnounceOutputsPhase(this.sessionClient);
		announceOutputsPhase.SetPrerequisitePhases([announceLeafSendBlocksPhase]);

		phaseTracker.AddPhase(announcePubKeysPhase);
		phaseTracker.AddPhase(buildAccountTreePhase);
		phaseTracker.AddPhase(announceLeafSendBlocksPhase);
		phaseTracker.AddPhase(announceOutputsPhase);

		return phaseTracker;
	}
}

export default MixPhaseFactory;
