import PhaseTracker from "./PhaseTracker";
import MixAnnouncePubKeysPhase from "./MixAnnouncePubKeysPhase";
import MixAnnounceOutputsPhase from "./MixAnnounceOutputsPhase";
import MixAnnounceLeafSendBlocksPhase from "./MixAnnounceLeafSendBlocksPhase";
import MixBuildAccountTreePhase from "./MixBuildAccountTreePhase";
import MixCreateLeafSendBlocksPhase from "./MixCreateLeafSendBlocksPhase";
import MixBuildTransactionPathsPhase from "./MixBuildTransactionPathsPhase";
import MixSignTransactionsPhase from "./MixSignTransactionsPhase";

class MixPhaseFactory {
	constructor(sessionClient, signatureDataCodec, blockBuilder, blockSigner, nanoNodeClient, signTransactionPhaseFactory) {
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;
		this.blockSigner = blockSigner;
		this.nanoNodeClient = nanoNodeClient;
		this.signTransactionPhaseFactory = signTransactionPhaseFactory;
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

		// let buildRefundPathsPhase = new MixBuildRefundPathsPhase(this.blockBuilder);
		// buildRefundPathsPhase.SetPrerequisitePhases([buildTransactionPathsPhase]);

		let signTransactionsPhase = new MixSignTransactionsPhase(this.signTransactionPhaseFactory)
		// signTransactionsPhase.SetPrerequisitePhases([buildRefundPathsPhase]);
		signTransactionsPhase.SetPrerequisitePhases([buildTransactionPathsPhase]);

		// let publishTransactionsPhase = new MixPublishTransactionsPhase(this.nanoNodeClient)
		// publishTransactionsPhase.SetPrerequisitePhases([signTransactionsPhase]);

		phaseTracker.AddPhase(announcePubKeysPhase);
		phaseTracker.AddPhase(buildAccountTreePhase);
		phaseTracker.AddPhase(createLeafSendBlocksPhase);
		phaseTracker.AddPhase(announceLeafSendBlocksPhase);
		phaseTracker.AddPhase(announceOutputsPhase);
		phaseTracker.AddPhase(buildTransactionPathsPhase);
		// phaseTracker.AddPhase(buildRefundPathsPhase);
		phaseTracker.AddPhase(signTransactionsPhase);
		// phaseTracker.AddPhase(publishTransactionsPhase);

		return phaseTracker;
	}
}

export default MixPhaseFactory;
