import * as NanoCurrency from 'nanocurrency';

class BlockBuilder {
	constructor() {
		this.DefaultRepNodeAddress = 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'; // Nano Foundation #1
		this.tempSecretKey = '0000000000000000000000000000000000000000000000000000000000000002';
		this.previousBlockHashForOpenBlock = '0000000000000000000000000000000000000000000000000000000000000000';
	}

	GetUnsignedSendBlock(sendingNanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, destinationNanoAddress) {
		return this.getUnsignedBlock(sendingNanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, destinationNanoAddress);
	}

	GetUnsignedReceiveBlock(receivingNanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, pendingBlockHash) {
		return this.getUnsignedBlock(receivingNanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, pendingBlockHash);
	}

	getUnsignedBlock(nanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, pendingBlockHash) {
		repNodeAddress = (repNodeAddress ? repNodeAddress : this.DefaultRepNodeAddress)

		let hash = this.getBlockHash(nanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, pendingBlockHash);

		let block = NanoCurrency.createBlock(this.tempSecretKey, {
			work: null,
			previous: previousBlockHash,
			representative: repNodeAddress,
			balance: newBalanceAmountInRaw,
			link: pendingBlockHash,
		});

		block.hash = hash;
		block.block.account = nanoAddress;
		block.block.signature = null;

		return block;
	}

	getBlockHash(nanoAddress, previousBlockHash, representativeAddress, balanceInRaw, linkBlockHash) {
		previousBlockHash = (previousBlockHash === null)
			? this.previousBlockHashForOpenBlock
			: previousBlockHash;

		console.log('Getting block hash with balance: '+balanceInRaw);

		return NanoCurrency.hashBlock({
			account: nanoAddress,
			previous: previousBlockHash,
			representative: representativeAddress,
			balance: balanceInRaw,
			link: linkBlockHash
		});
	}

}

export default BlockBuilder;
