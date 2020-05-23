class AccountTreeBuilder {
	constructor(sessionClient, cryptoUtils, ec) {
		this.cryptoUtils = cryptoUtils;
		this.ec = ec;

		this.inputPublicKeys = [];
		this.outputNanoAddresses = [];
		this.unsignedFirstLayerSendBlocks = [];
	}

	AddInputPublicKey(publicKeyHex) {

	}

	AddOutputNanoAddress(outputNanoAddress, amountInNano) {

	}

	AddUnsignedFirstLayerSendBlock(sendBlockData) {

	}

	GetAccountTreeDigest() {

	}

	GetAccountTreeObject() {
		
	}
}

export default AccountTreeBuilder;
