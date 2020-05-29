class AccountNode {
	constructor(componentPublicKeysHex, nanoAddress) {
		this.componentPublicKeysHex = componentPublicKeysHex;
		this.NanoAddress = nanoAddress;

		this.AccountNodeLeft = null;
		this.AccountNodeRight = null;

		this.MixAmountRaw = '0';

		this.IncomingLeafSendBlocks = [];

		this.TransactionPaths = {
			Success: [],
			RefundLeft: [],
			RefundRight: [],
			RefundBoth: [],
		};
	}

	GetComponentPublicKeysHex() {
		return this.componentPublicKeysHex;
	}

	AddIncomingLeafSendBlock(sendBlock, amountRaw) {
		this.IncomingLeafSendBlocks.push({
			Block: sendBlock,
			AmountRaw: amountRaw
		});
	}

	IsLeafNode() {
		return (this.AccountNodeLeft === null && this.AccountNodeRight === null);
	}

	GetSuccessPathSendBlock(destinationNanoAddress) {
		let resultBlock = null;
		this.TransactionPaths.Success.forEach((blockInfo) => {
			if (blockInfo.block.link_as_account === destinationNanoAddress) {
				resultBlock = blockInfo;
			}
		});

		return resultBlock;
	}
}

export default AccountNode;
