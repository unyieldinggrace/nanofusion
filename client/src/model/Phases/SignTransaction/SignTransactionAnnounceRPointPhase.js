import MixEventTypes from "../../EventTypes/MixEventTypes";
import BaseSigningPhase from "./BaseSigningPhase";

class SignTransactionAnnounceRPointPhase extends BaseSigningPhase {
	constructor(sessionClient, signatureDataCodec, blockSigner, messageToSign) {
		super();
		this.Name = 'Announce RPoints';
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
		this.messageToSign = messageToSign;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceRPoint, this.onPeerAnnouncesRPoint.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestRPoints, this.onPeerRequestsRPoints.bind(this));

		this.foreignRCommitments = null;
		this.foreignRPoints = null;
		this.myPrivateKeys = null;
		this.myPubKeys = null;
		this.foreignPubKeys = null;
		this.latestState = null;
	}

	executeInternal(state) {
		this.latestState = state;
		// console.log('Signing Phase: Announcing R Points.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;
		this.foreignRCommitments = state.ForeignRCommitments;
		this.foreignRPoints = state.ForeignRPoints;

		this.sessionClient.SendEvent(MixEventTypes.RequestRPoints, {MessageToSign: this.messageToSign});
		this.broadcastMyRPoints();
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;
		this.foreignRPoints = state.ForeignRPoints;

		if (!this.IsRunning()) {
			return;
		}

		if (this.getAllRPointsReceivedAndValidated()) {
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesRPoint(data) {
		if (!this.getAnnouncementIsForCorrectMessage(data)) {
			return;
		}

		if (!this.IsRunning()) {
			return;
		}

		this.checkIncomingMessageIsValid(data, 'RPoint');

		let decodedRPoint = this.signatureDataCodec.DecodeRPoint(data.Data.RPoint);
		let currentRPoint = this.foreignRPoints[data.Data.MessageToSign][data.Data.PubKey];
		if (currentRPoint && (!currentRPoint.eq(decodedRPoint))) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update RPoint. This is not allowed. Skipping.');
		}

		this.foreignRPoints[data.Data.MessageToSign][data.Data.PubKey] = decodedRPoint;
		this.notifyStateChange({
			ForeignRPoints: this.foreignRPoints
		});

		// this.sessionClient.SendEvent(JointAccountEventTypes.RequestForRPoint, {
		// 	MessageToSign: data.Data.MessageToSign,
		// 	RCommitments: this.getRCommitmentMapEncoded(data.Data.MessageToSign)
		// });

		// this.provideMyRPoint(data.Data.MessageToSign);
	}

	ensureDataStructuresAreDefined(messageToSign) {
		if (!this.foreignRPoints[messageToSign]) {
			this.foreignRPoints[messageToSign] = {};
		}
	}

	onPeerRequestsRPoints(data) {
		if (!this.getAnnouncementIsForCorrectMessage(data)) {
			return;
		}

		if (this.IsRunning()) {
			this.broadcastMyRPoints();
		}
	}

	broadcastMyRPoints() {
		this.myPrivateKeys.forEach((privateKey) => {
			// console.log('Broadcasting RPoint for message: '+this.messageToSign);

			let pubKeyPoint = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let RPoint = this.blockSigner.GetRPoint(privateKey, this.messageToSign);
			let RPointEncoded = this.signatureDataCodec.EncodeRPoint(RPoint);

			this.sessionClient.SendEvent(MixEventTypes.AnnounceRPoint, {
				PubKey: this.signatureDataCodec.EncodePublicKey(pubKeyPoint),
				MessageToSign: this.messageToSign,
				RPoint: RPointEncoded,
				Signature: this.blockSigner.SignMessageSingle(RPointEncoded, privateKey).toHex()
			});
		});
	}

	getAllRPointsReceivedAndValidated() {
		let requiredForeignPubKeysHex = this.getRequiredForeignPubKeysHexForTransaction(this.messageToSign);
		let numForeignRPoints = this.foreignRPoints[this.messageToSign]
			? Object.keys(this.foreignRPoints[this.messageToSign]).length
			: 0;

		if (numForeignRPoints !== requiredForeignPubKeysHex.length) {
			return false;
		}

		this.checkAllRCommitmentsAreValid(this.messageToSign);

		return true;
	}

	checkAllRCommitmentsAreValid(messageToSign) {
		if (!Object.keys(this.foreignRPoints).length || !Object.keys(this.foreignRCommitments).length) {
			return; // all RPoints are mine
		}

		Object.keys(this.foreignRCommitments[messageToSign]).forEach((key) => {
			let RPoint = this.foreignRPoints[messageToSign][key];
			let RCommitment = this.foreignRCommitments[messageToSign][key];

			if (!this.blockSigner.GetRPointValid(RPoint, RCommitment)) {
				throw Error('RCommitment does not match RPoint for PubKey: '+key);
			}
		});
	}
}

export default SignTransactionAnnounceRPointPhase;
