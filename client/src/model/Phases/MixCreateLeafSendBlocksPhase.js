import BasePhase from "./BasePhase";
import * as nanocurrency from 'NanoCurrency';

class MixCreateLeafSendBlocksPhase extends BasePhase {
	constructor(signatureDataCodec, blockBuilder, blockSigner, nanoNodeClient) {
		super();
		this.Name = 'Create Leaf-Send Blocks';
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;
		this.blockSigner = blockSigner;
		this.nanoNodeClient = nanoNodeClient;
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
		this.myPrivateKeys.forEach((privateKey) => {
			this.myLeafSendBlocks.push(this.buildLeafSendBlock(privateKey));
		});
	}

	async buildLeafSendBlock(privateKey) {
		let publicKey = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
		let publicKeyHex = this.signatureDataCodec.EncodePublicKey(publicKey);
		let nanoPublicKey = nanocurrency.derivePublicKey(privateKey);
		let nanoAddress = nanocurrency.deriveAddress(nanoPublicKey, {useNanoPrefix: true});

		let accountInfo = await this.nanoNodeClient.GetAccountInfo(nanoAddress);

		this.blockBuilder.GetUnsignedSendBlock(
			nanoAddress,
			accountInfo.frontier,
			accountInfo.representative,
			'0',
			this.accountTree.GetLeafAccountNodeForPublicKeyHex(publicKeyHex).NanoAddress
		);
	}

}

export default MixCreateLeafSendBlocksPhase;
