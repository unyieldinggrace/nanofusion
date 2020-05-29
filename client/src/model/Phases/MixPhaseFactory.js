import PhaseTracker from "./PhaseTracker";
import MixAnnouncePubKeysPhase from "./MixAnnouncePubKeysPhase";
import MixAnnounceOutputsPhase from "./MixAnnounceOutputsPhase";
import MixAnnounceLeafSendBlocksPhase from "./MixAnnounceLeafSendBlocksPhase";
import MixBuildAccountTreePhase from "./MixBuildAccountTreePhase";
import MixCreateLeafSendBlocksPhase from "./MixCreateLeafSendBlocksPhase";
import MixBuildTransactionPathsPhase from "./MixBuildTransactionPathsPhase";

class MixPhaseFactory {
	constructor(sessionClient, signatureDataCodec, blockBuilder, blockSigner, nanoNodeClient) {
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;
		this.blockSigner = blockSigner;
		this.nanoNodeClient = nanoNodeClient;
	}

	BuildPhaseTracker() {
		let phaseTracker = new PhaseTracker();
		let announcePubKeysPhase = new MixAnnouncePubKeysPhase(this.sessionClient, this.signatureDataCodec);

		let buildAccountTreePhase = new MixBuildAccountTreePhase(this.signatureDataCodec, this.blockSigner, this.blockBuilder);
		buildAccountTreePhase.SetPrerequisitePhases([announcePubKeysPhase]);

		let createLeafSendBlocksPhase = new MixCreateLeafSendBlocksPhase(this.signatureDataCodec, this.blockBuilder, this.blockSigner, this.nanoNodeClient);
		createLeafSendBlocksPhase.SetPrerequisitePhases([buildAccountTreePhase]);

		let announceLeafSendBlocksPhase = new MixAnnounceLeafSendBlocksPhase(this.sessionClient, this.signatureDataCodec, this.blockBuilder);
		announceLeafSendBlocksPhase.SetPrerequisitePhases([createLeafSendBlocksPhase]);

		let announceOutputsPhase = new MixAnnounceOutputsPhase(this.sessionClient);
		announceOutputsPhase.SetPrerequisitePhases([announceLeafSendBlocksPhase]);

		let buildTransactionPathsPhase = new MixBuildTransactionPathsPhase(this.blockBuilder);
		buildTransactionPathsPhase.SetPrerequisitePhases([announceOutputsPhase]);

		phaseTracker.AddPhase(announcePubKeysPhase);
		phaseTracker.AddPhase(buildAccountTreePhase);
		phaseTracker.AddPhase(createLeafSendBlocksPhase);
		phaseTracker.AddPhase(announceLeafSendBlocksPhase);
		phaseTracker.AddPhase(announceOutputsPhase);
		phaseTracker.AddPhase(buildTransactionPathsPhase);

		return phaseTracker;
	}
}

export default MixPhaseFactory;
