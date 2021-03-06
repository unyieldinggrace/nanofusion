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

		this.myPrivateKeys = null;
		this.myPubKeys = null;
		this.foreignPubKeys = null;
		this.latestState = null;
	}

	executeInternal(state) {
		this.latestState = state;

		// if (this.KNOWN_TRANSACTIONS.indexOf(this.messageToSign) === -1) {
		// 	console.log('Signing Phase: Announce R Points for "'+this.messageToSign+'"');
		// }

		// console.log('Signing Phase: Announcing R Points.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;

		this.sessionClient.SendEvent(MixEventTypes.RequestRPoints, {MessageToSign: this.messageToSign});
		this.broadcastMyRPoints();
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;

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
		let currentRPoint = this.latestState.SignatureComponentStore.GetRPoint(data.Data.MessageToSign, data.Data.PubKey);
		if (currentRPoint && (!currentRPoint.eq(decodedRPoint))) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update RPoint. This is not allowed. Skipping.');
		}

		this.latestState.SignatureComponentStore.AddRPoint(data.Data.MessageToSign, data.Data.PubKey, decodedRPoint);
		this.emitStateUpdate({
			SignatureComponentStore: this.latestState.SignatureComponentStore
		});
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
		let requiredPubKeysHex = this.latestState.AccountTree.GetPubKeysHexForTransactionHash(this.messageToSign);

		this.myPrivateKeys.forEach((privateKey) => {
			// console.log('Broadcasting Signature Contribution for message: '+this.messageToSign);

			let pubKeyPoint = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let pubKeyHex = this.signatureDataCodec.EncodePublicKey(pubKeyPoint);

			if (requiredPubKeysHex.indexOf(pubKeyHex) === -1) {
				return true;
			}

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
		let numForeignRPoints = this.latestState.SignatureComponentStore.GetAllRPoints(this.messageToSign)
			? Object.keys(this.latestState.SignatureComponentStore.GetAllRPoints(this.messageToSign)).length
			: 0;

		if (numForeignRPoints !== requiredForeignPubKeysHex.length) {
			return false;
		}

		this.checkAllRCommitmentsAreValid(this.messageToSign);

		return true;
	}

	checkAllRCommitmentsAreValid(messageToSign) {
		if (!(
			this.latestState.SignatureComponentStore.GetAllRPoints(this.messageToSign)
			&& this.latestState.SignatureComponentStore.GetAllRCommitments(this.messageToSign)
			&& this.latestState.SignatureComponentStore.GetAllRPoints(this.messageToSign).length
			&& this.latestState.SignatureComponentStore.GetAllRCommitments(this.messageToSign).length
		)) {
			return; // all RPoints are mine
		}

		Object.keys(this.latestState.SignatureComponentStore.GetAllRCommitments(messageToSign)).forEach((key) => {
			let RPoint = this.latestState.SignatureComponentStore.GetRPoint(messageToSign, key);
			let RCommitment = this.latestState.SignatureComponentStore.GetRCommitment(messageToSign, key);

			if (!this.blockSigner.GetRPointValid(RPoint, RCommitment)) {
				throw Error('RCommitment does not match RPoint for PubKey: '+key);
			}
		});
	}
}

export default SignTransactionAnnounceRPointPhase;
