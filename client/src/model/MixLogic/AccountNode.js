class AccountNode {
	constructor(componentPublicKeys) {
		this.NanoAddress = null;
		this.componentPublicKeys = componentPublicKeys.filter((publicKey) => {
			return !!publicKey;
		});

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
