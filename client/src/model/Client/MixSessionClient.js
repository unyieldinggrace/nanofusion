import JointAccountEventTypes from "../EventTypes/JointAccountEventTypes";
import BaseClient from "./BaseClient";
import NanoAmountConverter from "../Cryptography/NanoAmountConverter";

class MixSessionClient extends BaseClient {
	constructor(sessionClient,
				transactionTreeBuilder,
				signatureNegotiator,
				nanoNodeClient
	) {
		super(sessionClient);

		this.transactionTreeBuilder = transactionTreeBuilder;
		this.signatureNegotiator = signatureNegotiator;
		this.nanoNodeClient = nanoNodeClient;
		this.myPrivateKey = null;
		this.foreignPubKeys = [];
		this.foreignRCommitments = {};
		this.foreignRPoints = {};
		this.foreignSignatureContributions = {};
		this.transactionsWaitingForApproval = [];
		this.transactionsApproved = [];
		this.blocksInitiated = [];
	}

	SetUp() {
		this.sessionClient.SubscribeToEvent(EventTypes.ReadyToUseJointAccount, this.onPeerSignalsReady.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.RequestForPublicKey, this.onPeerRequestsPublicKey.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.RequestForRPoint, this.onPeerRequestsRPoint.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.RequestForSignatureContribution, this.onPeerRequestsSignatureContribution.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.ProvideRCommitment, this.onPeerProvidesRCommitment.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.ProvideRPoint, this.onPeerProvidesRPoint.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.ProvideSignatureContribution, this.onPeerProvidesSignatureContribution.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.PeerDisconnected, this.onPeerDisconnected.bind(this));
		this.sessionClient.SubscribeToEvent(EventTypes.ProposeJointAccountTransaction, this.onJointAccountTransactionProposed.bind(this));

		this.sessionClient.SendEvent(EventTypes.RequestForPublicKey, {});
	}

	TearDown() {
		this.sessionClient.UnsubscribeFromAllEvents();
	}

	UpdatePrivateKey(accountSeed, nanoAddress) {
		this.myPrivateKey = this.accountFinder.GetPrivateKeyForAccount(accountSeed, nanoAddress);
		this.notifyStateChange({
			JointNanoAddress: this.getJointNanoAddress()
		});
	}

	SignalReady() {
		this.sendPublicKeyToPeers();
		this.notifyStateChange({JointNanoAddress: this.getJointNanoAddress()});
	}

	async ScanAddress(address) {
		let accountInfo = await this.nanoNodeClient.GetAccountInfo(address);
		let pendingBlocksData = await this.nanoNodeClient.GetPendingBlocks(address);
		let blocksInfo = await this.nanoNodeClient.GetBlocksInfo(pendingBlocksData.blocks);
		let pendingBlocks = [];

		Object.keys(blocksInfo.blocks).forEach((blockHash) => {
			pendingBlocks.push({
				Hash: blockHash,
				SenderAccount: blocksInfo.blocks[blockHash].block_account,
				Amount: NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(blocksInfo.blocks[blockHash].amount)
			});
		});

		let balance = this.getAccountInfoProperty(accountInfo, 'balance');
		balance = (balance === null) ? '0' : NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(balance)

		this.notifyStateChange({
			JointAccountCurrentBalance: balance,
			JointAccountPendingBlocks: pendingBlocks,
		});
	}

	async ReceivePendingBlocks(address) {
		let accountInfo = await this.nanoNodeClient.GetAccountInfo(address);
		let pendingBlocksData = await this.nanoNodeClient.GetPendingBlocks(address);
		let blocksInfo = await this.nanoNodeClient.GetBlocksInfo(pendingBlocksData.blocks);

		let currentBalanceInRaw = this.getAccountInfoProperty(accountInfo, 'balance');
		currentBalanceInRaw = currentBalanceInRaw ? currentBalanceInRaw : '0';

		Object.keys(blocksInfo.blocks).forEach((blockHash) => {
			let pendingBlock = blocksInfo.blocks[blockHash];

			let receiveBlock = this.blockBuilder.GetUnsignedReceiveBlock(
				address,
				this.getAccountInfoProperty(accountInfo, 'frontier'),
				this.getAccountInfoProperty(accountInfo, 'representative'),
				NanoAmountConverter.prototype.AddRawAmounts(pendingBlock.amount, currentBalanceInRaw),
				blockHash
			);

			let proposedTransaction = {
				Block: receiveBlock.block,
				Hash: receiveBlock.hash,
				Amount: NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(pendingBlock.amount),
				OtherAccount: pendingBlock.block_account,
				IsSend: false
			};

			this.initiateTransactionApproval(proposedTransaction);
		});

		this.notifyStateChange({TransactionsApproved: this.transactionsApproved});
	}

	async SendFunds(jointAccount, destinationAccount, amountInNano) {
		let amountInRaw = NanoAmountConverter.prototype.ConvertNanoAmountToRawAmount(amountInNano);
		let accountInfo = await this.nanoNodeClient.GetAccountInfo(jointAccount);
		let currentBalanceInRaw = this.getAccountInfoProperty(accountInfo, 'balance');

		let sendBlock = this.blockBuilder.GetUnsignedSendBlock(
			jointAccount,
			this.getAccountInfoProperty(accountInfo, 'frontier'),
			this.getAccountInfoProperty(accountInfo, 'representative'),
			NanoAmountConverter.prototype.SubtractSendAmount(currentBalanceInRaw, amountInRaw),
			destinationAccount
		);

		let proposedTransaction = {
			Block: sendBlock.block,
			Hash: sendBlock.hash,
			Amount: amountInNano,
			OtherAccount: destinationAccount,
			IsSend: true
		};

		this.initiateTransactionApproval(proposedTransaction);

		this.notifyStateChange({TransactionsApproved: this.transactionsApproved});
	}

	initiateTransactionApproval(proposedTransaction) {
		this.transactionsApproved.push(proposedTransaction);
		this.blocksInitiated.push(proposedTransaction.Hash);
		this.sessionClient.SendEvent(EventTypes.ProposeJointAccountTransaction, proposedTransaction);
		this.provideRCommitmentForHash(proposedTransaction.Hash);
	}

	provideRCommitmentForHash(hash) {
		let RCommitment = this.getMyRCommitment(hash);
		let encodedRCommitment = this.signatureDataCodec.EncodeRCommitment(RCommitment);

		this.sessionClient.SendEvent(EventTypes.ProvideRCommitment, {
			PubKey: this.signatureDataCodec.EncodePublicKey(this.getMyPublicKey()),
			MessageToSign: hash,
			RCommitment: encodedRCommitment,
			Signature: this.blockSigner.SignMessageSingle(encodedRCommitment, this.myPrivateKey).toHex()
		});
	}

	ApproveTransactions(hashes) {
		hashes.forEach((hash) => {
			this.provideRCommitmentForHash(hash);

			this.moveTransactionFromWaitingForApprovalToApproved(hash);
		});

		this.notifyStateChange({
			TransactionsApproved: this.transactionsApproved,
			TransactionsWaitingForApproval: this.transactionsWaitingForApproval
		});
	}

	moveTransactionFromWaitingForApprovalToApproved(hash) {
		let index = 0;
		this.transactionsWaitingForApproval.forEach((transaction) => {
			if (transaction.Hash === hash) {
				return false;
			}
		});

		let transaction = this.transactionsWaitingForApproval[index];
		this.transactionsApproved.push(transaction);
		this.transactionsWaitingForApproval.splice(index, 1);
	}

	getAccountInfoProperty(accountInfo, property) {
		if (accountInfo.error === 'Account not found') {
			return null;
		}

		return accountInfo[property];
	}

	sendPublicKeyToPeers() {
		this.sessionClient.SendEvent(EventTypes.ReadyToUseJointAccount, {
			'PubKey': this.signatureDataCodec.EncodePublicKey(this.getMyPublicKey())
		});
	}

	onPeerSignalsReady(data) {
		let pubKeyPoint = this.signatureDataCodec.DecodePublicKey(data.Data.PubKey);
		this.addPubKeyToForeignSet(pubKeyPoint);

		this.notifyStateChange({
			JointNanoAddress: this.getJointNanoAddress(),
			NumJointAccountContributors: this.getPubKeySet().length
		});
	}

	onPeerRequestsPublicKey() {
		this.sendPublicKeyToPeers();
	}

	onPeerRequestsRPoint(data) {
		this.provideMyRPoint(data.Data.MessageToSign);
	}

	provideMyRPoint(messageToSign) {
		let myRPoint = this.getMyRPoint(messageToSign);
		let encodedRPoint = this.signatureDataCodec.EncodeRPoint(myRPoint);

		this.sessionClient.SendEvent(EventTypes.ProvideRPoint, {
			PubKey: this.signatureDataCodec.EncodePublicKey(this.getMyPublicKey()),
			MessageToSign: messageToSign,
			RPoint: encodedRPoint,
			Signature: this.blockSigner.SignMessageSingle(encodedRPoint, this.myPrivateKey).toHex()
		});
	}

	onPeerRequestsSignatureContribution(data) {
		this.provideMySignatureContribution(data.Data.MessageToSign);
	}

	provideMySignatureContribution(messageToSign) {
		let signatureContribution = this.getMySignatureContribution(messageToSign);
		let encodedSignatureContribution = this.signatureDataCodec.EncodeSignatureContribution(signatureContribution);

		this.sessionClient.SendEvent(EventTypes.ProvideSignatureContribution, {
			PubKey: this.signatureDataCodec.EncodePublicKey(this.getMyPublicKey()),
			MessageToSign: messageToSign,
			SignatureContribution: encodedSignatureContribution,
			Signature: this.blockSigner.SignMessageSingle(encodedSignatureContribution, this.myPrivateKey).toHex()
		});
	}

	onPeerProvidesRCommitment(data) {
		this.checkIncomingMessageIsValid(data, 'RCommitment');

		let decodedRCommitment = this.signatureDataCodec.DecodeRCommitment(data.Data.RCommitment);
		let currentRCommitment = this.foreignRCommitments[data.Data.MessageToSign][data.Data.PubKey];
		if (currentRCommitment && (!currentRCommitment.eq(decodedRCommitment))) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update RCommitment. This is not allowed. Skipping.');
		}

		this.foreignRCommitments[data.Data.MessageToSign][data.Data.PubKey] = decodedRCommitment;
		this.notifyStateChange({
			RCommitmentsReceived: this.foreignRCommitments
		});

		if (this.getRCommitmentSet(data.Data.MessageToSign).length !== this.getPubKeySet().length) {
			return;
		}

		if (this.blocksInitiated.indexOf(data.Data.MessageToSign) === -1) {
			return;
		}

		this.sessionClient.SendEvent(EventTypes.RequestForRPoint, {
			MessageToSign: data.Data.MessageToSign,
			RCommitments: this.getRCommitmentMapEncoded(data.Data.MessageToSign)
		});

		this.provideMyRPoint(data.Data.MessageToSign);
	}

	onPeerProvidesRPoint(data) {
		this.checkIncomingMessageIsValid(data, 'RPoint');

		let decodedRPoint = this.signatureDataCodec.DecodeRPoint(data.Data.RPoint);
		let currentRPoint = this.foreignRPoints[data.Data.MessageToSign][data.Data.PubKey];
		if (currentRPoint && (currentRPoint !== decodedRPoint)) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update RPoint. This is not allowed. Skipping.');
		}

		this.foreignRPoints[data.Data.MessageToSign][data.Data.PubKey] = decodedRPoint;
		this.notifyStateChange({
			RPointsReceived: this.foreignRPoints
		});

		if (this.getRPointSet(data.Data.MessageToSign).length !== this.getPubKeySet().length) {
			return;
		}

		if (this.blocksInitiated.indexOf(data.Data.MessageToSign) === -1) {
			return;
		}

		this.sessionClient.SendEvent(EventTypes.RequestForSignatureContribution, {
			MessageToSign: data.Data.MessageToSign,
			RPoints: this.getRPointMapEncoded(data.Data.MessageToSign)
		});

		this.provideMySignatureContribution(data.Data.MessageToSign);
	}

	onPeerProvidesSignatureContribution(data) {
		this.checkIncomingMessageIsValid(data, 'SignatureContribution');

		let decodedSignatureContribution = this.signatureDataCodec.DecodeSignatureContribution(data.Data.SignatureContribution);
		let currentSignatureContribution = this.foreignSignatureContributions[data.Data.MessageToSign][data.Data.PubKey];
		if (currentSignatureContribution && !currentSignatureContribution.eq(decodedSignatureContribution)) {
			throw new Error('Peer '+data.Data.PubKey+' tried to update Signature Contribution. This is not allowed. Skipping.');
		}

		this.foreignSignatureContributions[data.Data.MessageToSign][data.Data.PubKey] = decodedSignatureContribution;
		this.notifyStateChange({
			SignatureContributionsReceived: this.foreignSignatureContributions
		});

		if (this.getSignatureContributionSet(data.Data.MessageToSign).length !== this.getPubKeySet().length) {
			return;
		}

		if (this.blocksInitiated.indexOf(data.Data.MessageToSign) === -1) {
			return;
		}

		this.submitBlockWithHash(data.Data.MessageToSign);
	}

	checkIncomingMessageIsValid(data, signedValueKey) {
		this.checkPubKeyExists(data.Data.PubKey);
		this.checkIncomingMessageSignature(data.Data[signedValueKey], data.Data.Signature, data.Data.PubKey);
		this.ensureDataStructuresAreDefined(data.Data.MessageToSign);
	}

	checkPubKeyExists(pubKeyHex) {
		let pubKeysInHex = this.foreignPubKeys.map((pubKeyPoint) => this.signatureDataCodec.EncodePublicKey(pubKeyPoint));
		if (pubKeysInHex.indexOf(pubKeyHex) === -1) {
			throw new Error("Public key "+pubKeyHex+" not found in set of foreign public keys.");
		}
	}

	checkIncomingMessageSignature(data, signature, pubKeyHex) {
		if (!this.blockSigner.VerifyMessageSingle(data, signature, pubKeyHex)) {
			throw new Error("Incoming message failed signature verification. PubKey: "+pubKeyHex);
		}
	}

	ensureDataStructuresAreDefined(messageToSign) {
		if (!this.foreignRCommitments[messageToSign]) {
			this.foreignRCommitments[messageToSign] = {};
		}

		if (!this.foreignRPoints[messageToSign]) {
			this.foreignRPoints[messageToSign] = {};
		}

		if (!this.foreignSignatureContributions[messageToSign]) {
			this.foreignSignatureContributions[messageToSign] = {};
		}
	}

	async submitBlockWithHash(hash) {
		let transaction = this.getApprovedTransactionByHash(hash);
		if (!transaction) {
			console.log('No block found for hash: '+hash+'. Skipping.');
			return;
		}

		let RPoints = this.getRPointSet(hash);
		let signatureContributions = this.getSignatureContributionSet(hash);
		transaction.Block.signature = this.blockSigner.SignMessageMultiple(signatureContributions, RPoints);
		await this.nanoNodeClient.ProcessBlock(transaction.Block, transaction.IsSend);
		await this.ScanAddress(transaction.Block.account);
	}

	getApprovedTransactionByHash(hash) {
		let result = null;

		this.transactionsApproved.forEach((transaction) => {
			if (transaction.Hash === hash) {
				result = transaction;
				return false;
			}
		});

		return result;
	}

	onPeerDisconnected(data) {
		throw new Error('Peer disconnected. This case is not gracefully handled yet. You will need to start the process over to recover.');
	}

	onJointAccountTransactionProposed(data) {
		this.transactionsWaitingForApproval.push(data.Data);
		this.notifyStateChange({TransactionsWaitingForApproval: this.transactionsWaitingForApproval});
	}

	getPubKeySet() {
		let pubKeys = Array.from(this.foreignPubKeys);
		pubKeys.push(this.getMyPublicKey());

		pubKeys.sort(this.blockSigner.SortPointsByHexRepresentation.bind(this.blockSigner));

		return pubKeys;
	}

	getRCommitmentMapEncoded(messageToSign) {
		let encoder = this.signatureDataCodec.EncodeRCommitment.bind(this.signatureDataCodec);
		return this.getContributionMapEncoded(messageToSign, this.foreignRCommitments[messageToSign], this.getMyRCommitment(messageToSign), encoder);
	}

	getRCommitmentSet(messageToSign) {
		return this.getComponentSetByMessage(messageToSign, this.foreignRCommitments, this.getMyRCommitment(messageToSign));
	}

	getRPointMapEncoded(messageToSign) {
		let encoder = this.signatureDataCodec.EncodeRPoint.bind(this.signatureDataCodec);
		return this.getContributionMapEncoded(messageToSign, this.foreignRPoints[messageToSign], this.getMyRPoint(messageToSign), encoder);
	}

	getRPointSet(messageToSign) {
		return this.getComponentSetByMessage(messageToSign, this.foreignRPoints, this.getMyRPoint(messageToSign));
	}

	getSignatureContributionSet(messageToSign) {
		return this.getComponentSetByMessage(messageToSign, this.foreignSignatureContributions, this.getMySignatureContribution(messageToSign));
	}

	getContributionMapEncoded(messageToSign, foreignValues, myValue, encoder) {
		let map = {};
		let myPublicKeyHex = this.signatureDataCodec.EncodePublicKey(this.getMyPublicKey());
		let myValueHex = encoder(myValue);

		this.getPubKeySet().forEach((pubKey) => {
			let pubKeyHex = this.signatureDataCodec.EncodePublicKey(pubKey);

			if (foreignValues[pubKeyHex]) {
				map[pubKeyHex] = encoder(foreignValues[pubKeyHex]);
			} else if (pubKeyHex === myPublicKeyHex) {
				map[pubKeyHex] = myValueHex;
			}
		});

		return map;
	}

	getComponentSetByMessage(messageToSign, componentsStruct, myComponent) {
		if (!componentsStruct[messageToSign]) {
			return [];
		}

		let orderedUniqueElements = [];
		let myPubKeyHex = this.signatureDataCodec.EncodePublicKey(this.getMyPublicKey());
		componentsStruct[messageToSign][myPubKeyHex] = myComponent;

		let pubKeysInHex = Object.keys(componentsStruct[messageToSign]);
		pubKeysInHex = pubKeysInHex.filter((value, index, self) => {
			return (self.indexOf(value) === index);
		});

		pubKeysInHex.sort();
		pubKeysInHex.forEach((pubKeyHex) => {
			orderedUniqueElements.push(componentsStruct[messageToSign][pubKeyHex]);
		});

		return orderedUniqueElements;
	}

	addPubKeyToForeignSet(pubKey) {
		this.foreignPubKeys.push(pubKey);
		let keysFoundInHex = [];
		this.foreignPubKeys = this.foreignPubKeys.filter((value, index, self) => {
			let pubKeyHex = this.signatureDataCodec.EncodePublicKey(value);
			if (keysFoundInHex.indexOf(pubKeyHex) === -1) {
				keysFoundInHex.push(pubKeyHex);
				return true;
			}

			return false;
		});
	}

	getMyRCommitment(messageToSign) {
		return this.blockSigner.GetRCommitment(this.myPrivateKey, messageToSign);
	}

	getMyRPoint(messageToSign) {
		return this.blockSigner.GetRPoint(this.myPrivateKey, messageToSign);
	}

	getMySignatureContribution(messageToSign) {
		return this.blockSigner.GetSignatureContribution(this.myPrivateKey, messageToSign, this.getPubKeySet(), this.getRPointSet(messageToSign));
	}

	getMyPublicKey() {
		return this.blockSigner.GetPublicKeyFromPrivate(this.myPrivateKey);
	}

	getJointNanoAddress() {
		if (!this.myPrivateKey) {
			return null;
		}

		return this.blockSigner.GetNanoAddressForAggregatedPublicKey(this.getPubKeySet());
	}

}

export default MixSessionClient;
