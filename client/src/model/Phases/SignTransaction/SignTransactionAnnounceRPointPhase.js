import BasePhase from "./BaseSigningPhase";
import MixEventTypes from "../../EventTypes/MixEventTypes";

class SignTransactionAnnounceRPointPhase extends BasePhase {
	constructor(sessionClient, signatureDataCodec, blockSigner, messageToSign) {
		super();
		this.Name = 'Announce RCommitments';
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
		this.messageToSign = messageToSign;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceRPoint, this.onPeerAnnouncesRPoint.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestRPoints, this.onPeerRequestsRPoints.bind(this));

		this.foreignRCommitments = null;
		this.myPrivateKeys = null;
		this.myPubKeys = null;
		this.foreignPubKeys = null;
		this.latestState = null;
	}

	executeInternal(state) {
		this.latestState = state;
		console.log('Signing Phase: Announcing R Commitment.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;
		this.foreignRCommitments = state.ForeignRCommitments;

		this.sessionClient.SendEvent(MixEventTypes.RequestRCommitments, {});
		this.broadcastMyRCommitments();
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;
		if (this.getAllRPointsReceivedAndValidated()) {
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesRPoint(data) {
		this.checkIncomingMessageIsValid(data, 'RCommitment');

		let decodedRCommitment = this.signatureDataCodec.DecodeRCommitment(data.Data.RCommitment);
		let currentRCommitment = this.foreignRCommitments[data.Data.MessageToSign][data.Data.PubKey];
		if (currentRCommitment && (!currentRCommitment.eq(decodedRCommitment))) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update RCommitment. This is not allowed. Skipping.');
		}

		this.foreignRCommitments[data.Data.MessageToSign][data.Data.PubKey] = decodedRCommitment;
		this.notifyStateChange({
			ForeignRCommitments: this.foreignRCommitments
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

	onPeerRequestsRPoints() {
		this.broadcastMyRPoints();
	}

	broadcastMyRPoints() {
		this.myPrivateKeys.forEach((privateKey) => {
			console.log('Broadcasting RCommitment for message: '+this.messageToSign);

			let pubKeyPoint = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let RCommitment = this.blockSigner.GetRCommitment(privateKey, this.messageToSign);

			this.sessionClient.SendEvent(MixEventTypes.AnnounceRCommitment, {
				PubKey: this.signatureDataCodec.EncodePublicKey(pubKeyPoint),
				RCommitment: RCommitment,
				Signature: this.blockSigner.SignMessageSingle(RCommitment, privateKey)
			});
		});
	}

	getAllRPointsReceivedAndValidated() {
		// if (this.getRCommitmentSet(data.Data.MessageToSign).length === this.getPubKeySet().length) {
		// 	return true;
		// }

		return false;
	}
}

export default SignTransactionAnnounceRPointPhase;
