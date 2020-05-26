import BasePhase from "./BasePhase";
import * as NanoCurrency from 'nanocurrency';

class MixCreateLeafSendBlocksPhase extends BasePhase {
	constructor(signatureDataCodec, blockBuilder, blockSigner, nanoNodeClient) {
		super();
		this.Name = 'Create Leaf-Send Blocks';
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;
		this.blockSigner = blockSigner;
		this.nanoNodeClient = nanoNodeClient;

		this.myLeafSendBlocks = [];
	}

	async executeInternal(state) {
		console.log('Mix Phase: Create leaf send blocks.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.accountTree = state.AccountTree;

		await this.buildLeafSendBlocks();

		this.emitStateUpdate({
			MyLeafSendBlocks: this.myLeafSendBlocks
		});
	}

	async NotifyOfUpdatedState(state) {
		if (state.MyLeafSendBlocks.length) {
			this.markPhaseCompleted();
		}
	}

	async buildLeafSendBlocks() {
		this.myPrivateKeys.forEach(async (privateKey) => {
			this.myLeafSendBlocks.push(await this.buildLeafSendBlock(privateKey));
		});
	}

	async buildLeafSendBlock(privateKey) {
		let publicKey = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
		let publicKeyHex = this.signatureDataCodec.EncodePublicKey(publicKey);
		let nanoPublicKey = NanoCurrency.derivePublicKey(privateKey);
		let nanoAddress = NanoCurrency.deriveAddress(nanoPublicKey, {useNanoPrefix: true});

		let accountInfo = await this.nanoNodeClient.GetAccountInfo(nanoAddress);
		console.log(accountInfo);

		return this.blockBuilder.GetUnsignedSendBlock(
			nanoAddress,
			this.getAccountInfoProperty(accountInfo, 'frontier'),
			this.getAccountInfoProperty(accountInfo, 'representative'),
			'0',
			this.accountTree.GetLeafAccountNodeForPublicKeyHex(publicKeyHex).NanoAddress
		);
	}

	getAccountInfoProperty(accountInfo, property) {
		if (accountInfo.error === 'Account not found') {
			return null;
		}

		return accountInfo[property];
	}

}

export default MixCreateLeafSendBlocksPhase;
