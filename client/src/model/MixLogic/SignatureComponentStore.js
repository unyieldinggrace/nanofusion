class SignatureComponentStore {
	constructor() {
		this.data = {
			RCommitments: {},
			RPoints: {},
			SignatureContributions: {},
			JointSignaturesForHashes: {}
		};
	}

	AddRCommitment(message, pubKeyHex, RCommitment) {
		this.ensureDataStructuresAreDefined(message);
		this.data.RCommitments[message][pubKeyHex] = RCommitment;
	}

	GetRCommitment(message, pubKeyHex) {
		if (!this.data.RCommitments[message]) {
			return null;
		}

		return this.data.RCommitments[message][pubKeyHex];
	}

	GetAllRCommitments(message) {
		return this.data.RCommitments[message];
	}

	AddRPoint(message, pubKeyHex, RPoint) {
		this.ensureDataStructuresAreDefined(message);
		this.data.RPoints[message][pubKeyHex] = RPoint;
	}

	GetRPoint(message, pubKeyHex) {
		if (!this.data.RPoints[message]) {
			return null;
		}

		return this.data.RPoints[message][pubKeyHex];
	}

	GetAllRPoints(message) {
		return this.data.RPoints[message];
	}

	AddSignatureContribution(message, pubKeyHex, signatureContribution) {
		this.ensureDataStructuresAreDefined(message);
		this.data.SignatureContributions[message][pubKeyHex] = signatureContribution;
	}

	GetSignatureContribution(message, pubKeyHex) {
		if (!this.data.SignatureContributions[message]) {
			return null;
		}

		return this.data.SignatureContributions[message][pubKeyHex];
	}

	GetAllSignatureContributions(message) {
		return this.data.SignatureContributions[message];
	}

	AddJointSignatureForHash(message, jointSignature) {
		this.data.JointSignaturesForHashes[message] = jointSignature;
	}

	GetJointSignatureForHash(message) {
		return this.data.JointSignaturesForHashes[message];
	}

	GetAllJointSignaturesForHashes() {
		return this.data.JointSignaturesForHashes;
	}

	ensureDataStructuresAreDefined(messageToSign) {
		if (!this.data.RCommitments[messageToSign]) {
			this.data.RCommitments[messageToSign] = {};
			this.data.RPoints[messageToSign] = {};
			this.data.SignatureContributions[messageToSign] = {};
		}
	}
}

export default SignatureComponentStore;
