class Transaction {
	constructor() {
		this.Amount = null;
		this.FromAccount = null;
		this.ToAccount = null;
		this.SendBlockHash = null;
		this.ReceiveBlockHash = null;
		this.SendBlockSignature = null;
		this.ReceiveBlockSignature = null;
		this.SendBlockPreviousHash = null;
		this.ReceiveBlockPreviousHash = null;
		this.SendBlockRepresentative = null
		this.ReceiveBlockRepresentative = null;
	}
}

export default Transaction;
