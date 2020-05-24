class AccountNode {
	constructor() {
		this.NanoAddress = null;
		this.ComponentPublicKeys = [];

		this.AccountNodeLeft = null;
		this.AccountNodeRight = null;

		this.TransactionPaths = {
			Success: [],
			RefundLeft: [],
			RefundRight: [],
			RefundBoth: [],
		};
	}
}

export default AccountNode;
