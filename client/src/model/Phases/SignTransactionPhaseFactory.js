import PhaseTracker from "./PhaseTracker";

class SignTransactionPhaseFactory {
	constructor(sessionClient, signatureDataCodec, blockSigner) {
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
	}

	BuildPhaseTracker(messageToSign) {
		let phaseTracker = new PhaseTracker();
		let announceRCommitmentPhase = new SignTransactionAnnounceRCommitmentPhase(this.sessionClient, this.signatureDataCodec, this.blockSigner);

		let announceRPointPhase = new SignTransactionAnnounceRPointPhase(this.sessionClient, this.signatureDataCodec, this.blockSigner);
		announceRPointPhase.SetPrerequisitePhases([announceRCommitmentPhase]);

		let announceSignatureContributionPhase = new SignTransactionAnnounceSignatureContributionPhase(this.sessionClient, this.signatureDataCodec, this.blockSigner);
		announceSignatureContributionPhase.SetPrerequisitePhases([announceRPointPhase]);

		phaseTracker.AddPhase(announceRCommitmentPhase);
		phaseTracker.AddPhase(announceRPointPhase);
		phaseTracker.AddPhase(announceSignatureContributionPhase);

		return phaseTracker;
	}
}

export default SignTransactionPhaseFactory;
