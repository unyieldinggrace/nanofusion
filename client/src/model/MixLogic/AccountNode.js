class AccountNode {
	constructor(componentPublicKeysHex, nanoAddress) {
		this.componentPublicKeysHex = componentPublicKeysHex;
		this.NanoAddress = nanoAddress;

		this.AccountNodeLeft = null;
		this.AccountNodeRight = null;

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
}

export default AccountNode;
