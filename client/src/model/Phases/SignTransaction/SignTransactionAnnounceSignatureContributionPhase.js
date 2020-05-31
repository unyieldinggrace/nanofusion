import MixEventTypes from "../../EventTypes/MixEventTypes";
import BaseSigningPhase from "./BaseSigningPhase";

class SignTransactionAnnounceSignatureContributionPhase extends BaseSigningPhase {
	constructor(sessionClient, signatureDataCodec, blockSigner, messageToSign) {
		super();
		this.Name = 'Announce Signature Contributions';
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
		this.messageToSign = messageToSign;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceSignatureContribution, this.onPeerAnnouncesSignatureContribution.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestSignatureContributions, this.onPeerRequestsSignatureContributions.bind(this));

		this.foreignRPoints = null;
		this.myPrivateKeys = null;
		this.myPubKeys = null;
		this.foreignPubKeys = null;
		this.jointSignaturesForHashes = null;
		this.latestState = null;
	}

	executeInternal(state) {
		this.latestState = state;
		console.log('Signing Phase: Announcing Signature Contributions.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;
		this.foreignSignatureContributions = state.ForeignSignatureContributions;
		this.jointSignaturesForHashes = state.JointSignaturesForHashes;

		this.sessionClient.SendEvent(MixEventTypes.RequestSignatureContributions, {});
		this.broadcastMySignatureContributions();
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;
		this.jointSignaturesForHashes = state.JointSignaturesForHashes;

		if (!this.IsRunning()) {
			return;
		}

		if (this.getAllSignatureContributionsReceivedAndJointSignatureValidated()) {
			this.jointSignaturesForHashes[this.messageToSign] = this.getJointSignature(this.messageToSign);

			this.emitStateUpdate({
				JointSignaturesForHashes: this.jointSignaturesForHashes
			})
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesSignatureContribution(data) {
		this.checkIncomingMessageIsValid(data, 'SignatureContribution');

		let decodedSignatureContribution = this.signatureDataCodec.DecodeSignatureContribution(data.Data.SignatureContribution);
		let currentSignatureContribution = this.foreignSignatureContributions[data.Data.MessageToSign][data.Data.PubKey];
		if (currentSignatureContribution && (!currentSignatureContribution.eq(decodedSignatureContribution))) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update Signature Contribution. This is not allowed. Skipping.');
		}

		this.foreignSignatureContributions[data.Data.MessageToSign][data.Data.PubKey] = decodedSignatureContribution;
		this.notifyStateChange({
			ForeignSignatureContributions: this.foreignSignatureContributions
		});

		// this.sessionClient.SendEvent(JointAccountEventTypes.RequestForRPoint, {
		// 	MessageToSign: data.Data.MessageToSign,
		// 	RCommitments: this.getRCommitmentMapEncoded(data.Data.MessageToSign)
		// });

		// this.provideMyRPoint(data.Data.MessageToSign);
	}

	ensureDataStructuresAreDefined(messageToSign) {
		if (!this.foreignSignatureContributions[messageToSign]) {
			this.foreignSignatureContributions[messageToSign] = {};
		}
	}

	onPeerRequestsSignatureContributions() {
		if (this.IsRunning()) {
			this.broadcastMySignatureContributions();
		}
	}

	broadcastMySignatureContributions() {
		this.myPrivateKeys.forEach((privateKey) => {
			console.log('Broadcasting RPoint for message: '+this.messageToSign);

			let pubKeyPoint = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let signatureContribution = this.blockSigner.GetSignatureContribution(privateKey, this.messageToSign, pubKeys, RPoints);
			let signatureContributionEncoded = this.signatureDataCodec.EncodeSignatureContribution(signatureContribution);

			this.sessionClient.SendEvent(MixEventTypes.AnnounceSignatureContribution, {
				PubKey: this.signatureDataCodec.EncodePublicKey(pubKeyPoint),
				MessageToSign: this.messageToSign,
				SignatureContribution: signatureContributionEncoded,
				Signature: this.blockSigner.SignMessageSingle(signatureContributionEncoded, privateKey)
			});
		});
	}

	getAllSignatureContributionsReceivedAndJointSignatureValidated() {
		let requiredForeignPubKeysHex = this.getRequiredForeignPubKeysHexForTransaction(this.messageToSign);
		if (this.foreignSignatureContributions[this.messageToSign].length !== requiredForeignPubKeysHex.length) {
			return false;
		}

		let jointSignature = this.getJointSignature(this.messageToSign);
		let pubKeysForTransaction = this.latestState.AccountTree.GetPubKeysHexForTransactionHash(messageToSign).map((pubKeyHex) => {
			return this.signatureDataCodec.DecodePublicKey(pubKeyHex);
		});

		let aggregatedPublicKey = this.blockSigner.GetAggregatedPublicKey(pubKeysForTransaction);
		return this.blockSigner.VerifyMessageSingle(this.messageToSign, jointSignature, aggregatedPublicKey);
	}

	getJointSignature(messageToSign) {

	}
}

export default SignTransactionAnnounceSignatureContributionPhase;
