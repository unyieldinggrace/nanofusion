import BasePhase from "./BasePhase";
import * as NanoCurrency from 'nanocurrency';
import NanoAmountConverter from "../Cryptography/NanoAmountConverter";

class MixCreateLeafSendBlocksPhase extends BasePhase {
	constructor(signatureDataCodec, blockBuilder, blockSigner, nanoNodeClient) {
		super();
		this.Name = 'Create Leaf-Send Blocks';
		this.signatureDataCodec = signatureDataCodec;
		this.blockBuilder = blockBuilder;
		this.blockSigner = blockSigner;
		this.nanoNodeClient = nanoNodeClient;

		this.myLeafSendBlocks = [];
		this.leafSendBlockAmounts = {};
	}

	async executeInternal(state) {
		console.log('Mix Phase: Create leaf send blocks.');
		this.myPrivateKeys = state.MyPrivateKeys;
		this.accountTree = state.AccountTree;

		let newState = await this.buildLeafSendBlocks();

		this.emitStateUpdate({
			MyLeafSendBlocks: this.myLeafSendBlocks,
			LeafSendBlockAmounts: this.leafSendBlockAmounts
		});
	}

	async NotifyOfUpdatedState(state) {
		if (state.MyLeafSendBlocks.length) {
			this.markPhaseCompleted();
		}
	}

	async buildLeafSendBlocks() {
		let blockPromises = [];

		this.myPrivateKeys.forEach((privateKey) => {
			blockPromises.push(this.buildLeafSendBlock(privateKey));
		});

		let blocks = await Promise.all(blockPromises);

		blocks.forEach((block) => {
			this.myLeafSendBlocks.push(block);
		});
	}

	async buildLeafSendBlock(privateKey) {
		let publicKey = this.blockSigner.GetPublicKeyFromPrivate(privateKey);
		let publicKeyHex = this.signatureDataCodec.EncodePublicKey(publicKey);
		let nanoPublicKey = NanoCurrency.derivePublicKey(privateKey);
		let nanoAddress = NanoCurrency.deriveAddress(nanoPublicKey, {useNanoPrefix: true});

		let accountInfo = await this.nanoNodeClient.GetAccountInfo(nanoAddress);
		console.log(accountInfo);
		console.log('Nano Address for Key: ' + nanoAddress);

		let receivingAccountNode = this.accountTree.GetLeafAccountNodeForPublicKeyHex(publicKeyHex);

		let block = this.blockBuilder.GetUnsignedSendBlock(
			nanoAddress,
			this.getAccountInfoProperty(accountInfo, 'frontier'),
			this.getAccountInfoProperty(accountInfo, 'representative'),
			'0',
			receivingAccountNode.NanoAddress
		);

		receivingAccountNode.AddIncomingSendBlock(block);

		this.leafSendBlockAmounts[block.hash] = accountInfo.balance;

		return block;
	}

	getAccountInfoProperty(accountInfo, property) {
		if (accountInfo.error === 'Account not found') {
			return null;
		}

		return accountInfo[property];
	}

}

export default MixCreateLeafSendBlocksPhase;
