class AccountNode {
	constructor(componentPublicKeys, nanoAddress) {
		this.componentPublicKeys = componentPublicKeys;
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

	GetComponentPublicKeys() {
		return this.componentPublicKeys;
	}
}

export default AccountNode;
