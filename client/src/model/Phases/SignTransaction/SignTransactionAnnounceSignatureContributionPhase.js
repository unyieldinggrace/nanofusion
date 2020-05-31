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
		// console.log('Signing Phase: Announcing Signature Contributions.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;
		this.foreignSignatureContributions = state.ForeignSignatureContributions;
		this.jointSignaturesForHashes = state.JointSignaturesForHashes;

		this.sessionClient.SendEvent(MixEventTypes.RequestSignatureContributions, {MessageToSign: this.messageToSign});
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
			});

			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesSignatureContribution(data) {
		if (!this.getAnnouncementIsForCorrectMessage(data)) {
			return;
		}

		if (!this.IsRunning()) {
			return;
		}

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
	}

	ensureDataStructuresAreDefined(messageToSign) {
		if (!this.foreignSignatureContributions[messageToSign]) {
			this.foreignSignatureContributions[messageToSign] = {};
		}
	}

	onPeerRequestsSignatureContributions(data) {
		if (!this.getAnnouncementIsForCorrectMessage(data)) {
			return;
		}

		if (this.IsRunning()) {
			this.broadcastMySignatureContributions();
		}
	}

	broadcastMySignatureContributions() {
		this.myPrivateKeys.forEach((privateKey) => {
			// console.log('Broadcasting Signature Contribution for message: '+this.messageToSign);

			let pubKeyPoint = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let signatureContribution = this.blockSigner.GetSignatureContribution(
				privateKey,
				this.messageToSign,
				this.getAllPubKeys(this.messageToSign),
				this.getAllRPoints(this.messageToSign)
			);

			let signatureContributionEncoded = this.signatureDataCodec.EncodeSignatureContribution(signatureContribution);

			this.sessionClient.SendEvent(MixEventTypes.AnnounceSignatureContribution, {
				PubKey: this.signatureDataCodec.EncodePublicKey(pubKeyPoint),
				MessageToSign: this.messageToSign,
				SignatureContribution: signatureContributionEncoded,
				Signature: this.blockSigner.SignMessageSingle(signatureContributionEncoded, privateKey).toHex()
			});
		});
	}

	getAllSignatureContributionsReceivedAndJointSignatureValidated() {
		let requiredForeignPubKeysHex = this.getRequiredForeignPubKeysHexForTransaction(this.messageToSign);
		let numForeignSignatureContributions = this.foreignSignatureContributions[this.messageToSign]
			? Object.keys(this.foreignSignatureContributions[this.messageToSign]).length
			: 0;

		if (numForeignSignatureContributions !== requiredForeignPubKeysHex.length) {
			return false;
		}

		let jointSignature = this.getJointSignature(this.messageToSign);

		let aggregatedPublicKey = this.blockSigner.GetAggregatedPublicKey(this.getAllPubKeys(this.messageToSign));
		return this.blockSigner.VerifyMessageSingle(this.messageToSign, jointSignature, aggregatedPublicKey);
	}

	getJointSignature(messageToSign) {
		return this.blockSigner.SignMessageMultiple(
			this.getAllSignatureContributions(messageToSign),
			this.getAllRPoints(messageToSign)
		);
	}

	getAllSignatureContributions(messageToSign) {
		let allSignatureContributions = [];
		let requiredPubKeysHex = this.getAllPubKeysHex(messageToSign);

		if (this.latestState.ForeignSignatureContributions[messageToSign]) {
			Object.keys(this.latestState.ForeignSignatureContributions[messageToSign]).forEach((key) => {
				let signatureContribution = this.latestState.ForeignSignatureContributions[messageToSign][key];

				allSignatureContributions.push({
					PubKeyHex: key,
					SignatureContribution: signatureContribution
				});
			});
		}

		this.myPrivateKeys.forEach((privateKey) => {
			let pubKey = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let pubKeyHex = this.signatureDataCodec.EncodePublicKey(pubKey);

			if (requiredPubKeysHex.indexOf(pubKeyHex) === -1) {
				return true;
			}

			let signatureContribution = this.blockSigner.GetSignatureContribution(
				privateKey,
				messageToSign,
				this.getAllPubKeys(messageToSign),
				this.getAllRPoints(messageToSign)
			);

			allSignatureContributions.push({
				PubKeyHex: pubKeyHex,
				SignatureContribution: signatureContribution
			});
		});

		allSignatureContributions.sort((a, b) => {
			return a.PubKeyHex.localeCompare(b.PubKeyHex);
		});

		return allSignatureContributions.map((obj) => {
			return obj.SignatureContribution;
		});
	}

	getAllRPoints(messageToSign) {
		let allRPoints = [];
		let requiredPubKeysHex = this.getAllPubKeysHex(messageToSign);

		if (this.latestState.ForeignRPoints[messageToSign]) {
			Object.keys(this.latestState.ForeignRPoints[messageToSign]).forEach((key) => {
				allRPoints.push({
					PubKeyHex: key,
					RPoint: this.latestState.ForeignRPoints[messageToSign][key]
				});
			});
		}

		this.myPrivateKeys.forEach((privateKey) => {
			let pubKey = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let pubKeyHex = this.signatureDataCodec.EncodePublicKey(pubKey);

			if (requiredPubKeysHex.indexOf(pubKeyHex) === -1) {
				return true;
			}

			allRPoints.push({
				PubKeyHex: pubKeyHex,
				RPoint: this.blockSigner.GetRPoint(privateKey, messageToSign)
			});
		});

		allRPoints.sort((a, b) => {
			return a.PubKeyHex.localeCompare(b.PubKeyHex);
		});

		return allRPoints.map((obj) => {
			return obj.RPoint;
		});
	}

	getAllPubKeys(messageToSign) {
		return this.getAllPubKeysHex(messageToSign).map((pubKeyHex) => {
			return this.signatureDataCodec.DecodePublicKey(pubKeyHex);
		});
	}

	getAllPubKeysHex(messageToSign) {
		return this.latestState.AccountTree.GetPubKeysHexForTransactionHash(messageToSign);
	}
}

export default SignTransactionAnnounceSignatureContributionPhase;
