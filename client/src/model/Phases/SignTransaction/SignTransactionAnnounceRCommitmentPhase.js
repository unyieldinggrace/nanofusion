import MixEventTypes from "../../EventTypes/MixEventTypes";
import BaseSigningPhase from "./BaseSigningPhase";

class SignTransactionAnnounceRCommitmentPhase extends BaseSigningPhase {
	constructor(sessionClient, signatureDataCodec, blockSigner, messageToSign) {
		super();
		this.Name = 'Announce RCommitments';
		this.sessionClient = sessionClient;
		this.signatureDataCodec = signatureDataCodec;
		this.blockSigner = blockSigner;
		this.messageToSign = messageToSign;

		this.sessionClient.SubscribeToEvent(MixEventTypes.AnnounceRCommitment, this.onPeerAnnouncesRCommitment.bind(this));
		this.sessionClient.SubscribeToEvent(MixEventTypes.RequestRCommitments, this.onPeerRequestsRCommitments.bind(this));

		this.myPrivateKeys = null;
		this.myPubKeys = null;
		this.foreignPubKeys = null;
		this.latestState = null;
	}

	executeInternal(state) {
		this.latestState = state;

		// if (this.KNOWN_TRANSACTIONS.indexOf(this.messageToSign) === -1) {
		// 	console.log('Signing Phase: Announce R Commitments for "'+this.messageToSign+'"');
		// }

		// console.log('Signing Phase: Announcing R Commitments.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.myPubKeys = state.MyPubKeys;
		this.foreignPubKeys = state.ForeignPubKeys;

		this.sessionClient.SendEvent(MixEventTypes.RequestRCommitments, {MessageToSign: this.messageToSign});
		this.broadcastMyRCommitments();
	}

	async NotifyOfUpdatedState(state) {
		this.latestState = state;

		if (!this.IsRunning()) {
			return;
		}

		if (this.getAllRCommitmentsReceived()) {
			this.markPhaseCompleted();
		}
	}

	onPeerAnnouncesRCommitment(data) {
		if (!this.getAnnouncementIsForCorrectMessage(data)) {
			return;
		}

		if (!this.IsRunning()) {
			return;
		}

		this.checkIncomingMessageIsValid(data, 'RCommitment');
		this.checkAccountTreeDigest(data.Data.AccountTreeDigest);

		let decodedRCommitment = this.signatureDataCodec.DecodeRCommitment(data.Data.RCommitment);
		let currentRCommitment = this.latestState.SignatureComponentStore.GetRCommitment(data.Data.MessageToSign, data.Data.PubKey);
		if (currentRCommitment && (!currentRCommitment.eq(decodedRCommitment))) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update RCommitment. This is not allowed. Skipping.');
		}

		this.latestState.SignatureComponentStore.AddRCommitment(data.Data.MessageToSign, data.Data.PubKey, decodedRCommitment);
		this.emitStateUpdate({
			SignatureComponentStore: this.latestState.SignatureComponentStore
		});
	}

	onPeerRequestsRCommitments(data) {
		if (!this.getAnnouncementIsForCorrectMessage(data)) {
			return;
		}

		this.broadcastMyRCommitments();
	}

	broadcastMyRCommitments() {
		let requiredPubKeysHex = this.latestState.AccountTree.GetPubKeysHexForTransactionHash(this.messageToSign);

		this.myPrivateKeys.forEach((privateKey) => {
			// console.log('Broadcasting Signature Contribution for message: '+this.messageToSign);

			let pubKeyPoint = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
			let pubKeyHex = this.signatureDataCodec.EncodePublicKey(pubKeyPoint);

			if (requiredPubKeysHex.indexOf(pubKeyHex) === -1) {
				return true;
			}

			let RCommitment = this.blockSigner.GetRCommitment(privateKey, this.messageToSign);
			let RCommitmentEncoded = this.signatureDataCodec.EncodeRCommitment(RCommitment);

			this.sessionClient.SendEvent(MixEventTypes.AnnounceRCommitment, {
				PubKey: this.signatureDataCodec.EncodePublicKey(pubKeyPoint),
				MessageToSign: this.messageToSign,
				AccountTreeDigest: this.latestState.AccountTree.Digest(),
				RCommitment: RCommitmentEncoded,
				Signature: this.blockSigner.SignMessageSingle(RCommitmentEncoded, privateKey).toHex()
			});
		});
	}

	getAllRCommitmentsReceived() {
		let requiredForeignPubKeysHex = this.getRequiredForeignPubKeysHexForTransaction(this.messageToSign);
		let numForeignRCommitments = this.latestState.SignatureComponentStore.GetAllRCommitments(this.messageToSign)
			? Object.keys(this.latestState.SignatureComponentStore.GetAllRCommitments(this.messageToSign)).length
			: 0;

		return (numForeignRCommitments === requiredForeignPubKeysHex.length);
	}

	checkAccountTreeDigest(foreignAccountTreeDigest) {
		let localAccountTreeDigest = this.latestState.AccountTree.Digest();
		if (foreignAccountTreeDigest !== localAccountTreeDigest) {
			throw Error('Account tree digests do not match, aborting. Local: '+localAccountTreeDigest+', Foreign: '+foreignAccountTreeDigest);
		}
	}

}

export default SignTransactionAnnounceRCommitmentPhase;
