import BasePhase from "../BasePhase";

class BaseSigningPhase extends BasePhase {
	constructor() {
		super();
	}

	checkIncomingMessageIsValid(data, signedValueKey) {
		this.checkPubKeyExists(data.Data.PubKey);
		this.checkIncomingMessageSignature(data.Data[signedValueKey], data.Data.Signature, data.Data.PubKey);
		this.ensureDataStructuresAreDefined(data.Data.MessageToSign);
	}

	checkPubKeyExists(pubKeyHex) {
		let pubKeysInHex = this.foreignPubKeys.map((pubKeyPoint) => this.signatureDataCodec.EncodePublicKey(pubKeyPoint));
		if (pubKeysInHex.indexOf(pubKeyHex) === -1) {
			throw new Error("Public key "+pubKeyHex+" not found in set of foreign public keys.");
		}
	}

	checkIncomingMessageSignature(data, signature, pubKeyHex) {
		if (!this.blockSigner.VerifyMessageSingle(data, signature, pubKeyHex)) {
			throw new Error("Incoming message failed signature verification. PubKey: "+pubKeyHex);
		}
	}

	getRequiredForeignPubKeysHexForTransaction(messageToSign) {
		let requiredPubKeysHex = this.latestState.AccountTree.GetPubKeysHexForTransactionHash(messageToSign);
		return requiredPubKeysHex.filter((pubKeyHex) => {
			let result = true;
			this.myPubKeys.forEach((myPubKey) => {
				if (this.signatureDataCodec.EncodePublicKey(myPubKey) === pubKeyHex) {
					result = false;
					return false;
				}
			});

			return result;
		});
	}

	// ensureDataStructuresAreDefined(messageToSign) {
	// 	if (!this.foreignRCommitments[messageToSign]) {
	// 		this.foreignRCommitments[messageToSign] = {};
	// 	}
	//
	// 	if (!this.foreignRPoints[messageToSign]) {
	// 		this.foreignRPoints[messageToSign] = {};
	// 	}
	//
	// 	if (!this.foreignSignatureContributions[messageToSign]) {
	// 		this.foreignSignatureContributions[messageToSign] = {};
	// 	}
	// }

}

export default BaseSigningPhase;
