import BasePhase from "../BasePhase";

class BaseSigningPhase extends BasePhase {
	constructor() {
		super();
		
		this.KNOWN_TRANSACTIONS = [
			'E43CA492CC7420D2168665AC571230D8E2BC533454B5DF7E006A05D05C87ED95',
			'3126BB04534205B57A2E378D5632098C310302AAA6344003D3CAF8B699ABFD73',
			'DADAD4DFA602BCA50F5DB4D00A106B2D6DDED1BBAB05E3CFF52FCC098F94CF90',
			'4DEFC318CA11BF7E4DB7BA6CCBC8084DD898577A0E49D672CCA2385AD67AF554',
			'232CFD54A087699AD183E79C077162585B27072EAFE79DD98FE40F57F3431142',
			'5918C306EACEAF7316169FC52884A66ED4C6AF13C21DDD1B18CFDAB949B9511F',
			'391053D049B56B1D0909CDE7AE072C0446762B8864463D4AC7C6C9564A0E5DAD',
			'47192E68ED45CCC6C7F163F27BC7F9DCD917959E5064D8CA1F10FBE215990F76',
			'5333248EF728DAD9CF27A06AF19EB65801B2735BAA78C888B05CCE6784EE6E0A',
			'A7F55257AAC815ADC3F950521B11D96DE5EBC797DC407A5BEF3A8521DD00A384',
			'CD568D665FF186D87C5C30AB4D49C4CF9CA335AFA215360B2EBBAF33F75B0687',
			'177F467058C43837CC0AF0FBC3CAA6C6C0EE4D727605F8A3A029B772125F3F20'
		];
	}

	getAnnouncementIsForCorrectMessage(data) {
		return (data.Data.MessageToSign === this.messageToSign);
	}

	checkIncomingMessageIsValid(data, signedValueKey) {
		this.checkPubKeyExists(data.Data.PubKey);
		this.checkIncomingMessageSignature(data.Data[signedValueKey], data.Data.Signature, data.Data.PubKey);
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
