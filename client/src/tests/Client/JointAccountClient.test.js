import test from 'ava';
import JointAccountClient from "../../model/Client/JointAccountClient.js";
import MockSessionClient from "../Mocks/MockSessionClient.js";
import MockStandardClass from "../Mocks/MockStandardClass.js";
import EventTypes from "../../model/EventTypes";
import Factory from "../../model/Factory";

let testForeignPublicKeyHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51B7'; // real
let testForeignPublicKeyHex2 = '7DEBD899C78DF3D54FEDCFB1616F130CB73BC04F836367608F796567132108D4'; // real
let testMyPublicKeyHex = '3AE0F1B3347171F1A72FB07870274C3472467157F49F2CA079881765627DC509'; // real
let testForeignRCommitmentHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C0';
let testMyRCommitmentHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C1';
let testForeignRPointHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C2';
let testMyRPointHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C3';
let testForeignSignatureContributionHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C4';
let testMySignatureContributionHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C5';
let testSignatureHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C6';
let testSignatureMultipleHex = '61624309447EC8688F5B1CF5644B63471A3C0A9EF3B8CE9A9A7BBA9211EA51C7';
let testNanoAddress = 'nano_1hfcqh3gu34s5b6wo6tsc1k88doqaqbq5r34jkt96cq67frynu94wjn6dtbe';

test('When private key is updated, then joint nano address is updated', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let jointNanoAddress = null;
	jointAccountClient.OnStateUpdated((state) => {
		jointNanoAddress = state['JointNanoAddress'];
	});

	setUpOwnPrivateKey(jointAccountClient);

	t.is('nano_jointaddress_1', jointNanoAddress);
});

test('When public key is received, then joint nano address is updated', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let jointNanoAddress = null;
	jointAccountClient.OnStateUpdated((state) => {
		jointNanoAddress = state['JointNanoAddress'];
	});

	setUpOwnPrivateKey(jointAccountClient);

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	t.is('nano_jointaddress_2', jointNanoAddress);
});

test('When SignalReady is triggered, then public key is sent and joint nano address is updated', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let jointNanoAddress = null;
	jointAccountClient.OnStateUpdated((state) => {
		jointNanoAddress = state['JointNanoAddress'];
	});

	setUpOwnPrivateKey(jointAccountClient);

	jointNanoAddress = null;
	jointAccountClient.SignalReady();

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ReadyToUseJointAccount,
		Data: {
			PubKey: testMyPublicKeyHex
		}
	}));

	t.is('nano_jointaddress_1', jointNanoAddress);
});

test('When request for public key is received, then public key is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	setUpOwnPrivateKey(jointAccountClient);

	mockSessionClient.EmitMockEvent(EventTypes.RequestForPublicKey, {});

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ReadyToUseJointAccount,
		Data: {
			PubKey: testMyPublicKeyHex
		}
	}));
});

test('When SetUp is triggered, then request for public keys is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	jointAccountClient.SetUp();

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.RequestForPublicKey,
		Data: {}
	}));
});

test('When RPoint request is received, then RPoint message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	setUpOwnPrivateKey(jointAccountClient);

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';
	mockSessionClient.EmitMockEvent(EventTypes.RequestForRPoint, {Data: {
		MessageToSign: hashOfTestBlock
	}});

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideRPoint,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: hashOfTestBlock,
			RPoint: testMyRPointHex,
			Signature: testSignatureHex
		}
	}));
});

test('When Signature Contribution request is received, then Signature Contribution message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	setUpOwnPrivateKey(jointAccountClient);

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';
	mockSessionClient.EmitMockEvent(EventTypes.RequestForSignatureContribution, {Data: {
		MessageToSign: hashOfTestBlock
	}});

	t.true(mockBlockSigner.GetMethodCallOccurred({'Name': 'GetSignatureContribution'}));

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideSignatureContribution,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: hashOfTestBlock,
			SignatureContribution: testMySignatureContributionHex,
			Signature: testSignatureHex
		}
	}));
});

test('When R Commitment is received, and sig is verified, then state is updated', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	let stateUpdated = false;
	jointAccountClient.OnStateUpdated(() => {
		stateUpdated = true;
	});

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return (
		message === '12345'
		&& signature === 'abc123'
	); }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ProvideRCommitment, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		RCommitment: '12345',
		Signature: 'abc123'
	}});

	t.true(stateUpdated);
});

test('When R Commitment is received, and sig is NOT verified, then throw error.', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return false; }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	t.throws(() => {
		mockSessionClient.EmitMockEvent(EventTypes.ProvideRCommitment, {Data: {
				PubKey: testForeignPublicKeyHex,
				MessageToSign: hashOfTestBlock,
				RCommitment: '12345',
				Signature: 'abc123'
			}});
	});
});

test('When verified RCommitment is received, but it is not the last, then no RPoint request is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	let stateUpdated = false;
	jointAccountClient.OnStateUpdated(() => {
		stateUpdated = true;
	});

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return true; }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex2
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ProvideRCommitment, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		RCommitment: testForeignRCommitmentHex,
		Signature: testSignatureHex
	}});

	let RCommitments = {};
	RCommitments[testMyPublicKeyHex] = testMyRCommitmentHex;
	RCommitments[testForeignPublicKeyHex] = testForeignRCommitmentHex;

	t.false(mockSessionClient.GetEventSent({
		EventType: EventTypes.RequestForRPoint,
		Data: {
			MessageToSign: hashOfTestBlock,
			RCommitments: RCommitments
		}
	}));
});

test('When final verified RCommitment is received, then request RPoint message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	let stateUpdated = false;
	jointAccountClient.OnStateUpdated(() => {
		stateUpdated = true;
	});

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return true; }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	jointAccountClient.blocksInitiated = [hashOfTestBlock];

	mockSessionClient.EmitMockEvent(EventTypes.ProvideRCommitment, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		RCommitment: testForeignRCommitmentHex,
		Signature: testSignatureHex
	}});

	let RCommitments = {};
	RCommitments[testMyPublicKeyHex] = testMyRCommitmentHex;
	RCommitments[testForeignPublicKeyHex] = testForeignRCommitmentHex;

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.RequestForRPoint,
		Data: {
			MessageToSign: hashOfTestBlock,
			RCommitments: RCommitments
		}
	}));

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideRPoint,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: hashOfTestBlock,
			RPoint: testMyRPointHex,
			Signature: testSignatureHex
		}
	}));
});

test('When RPoint is received and matches commitment, but it is not the last, then no request SignatureComponents message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	let stateUpdated = false;
	jointAccountClient.OnStateUpdated(() => {
		stateUpdated = true;
	});

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return (
		message === testForeignRPointHex
		&& signature === testSignatureHex
	); }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex2
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ProvideRPoint, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		RPoint: testForeignRPointHex,
		Signature: testSignatureHex
	}});

	let RPoints = {};
	RPoints[testForeignPublicKeyHex] = testForeignRPointHex;
	RPoints[testMyPublicKeyHex] = testMyRPointHex;

	t.false(mockSessionClient.GetEventSent({
		EventType: EventTypes.RequestForSignatureContribution,
		Data: {
			MessageToSign: hashOfTestBlock,
			RPoints: RPoints
		}
	}));
});

test('When final verified RPoint is received and matches commitment, and I am the initiator, then request SignatureComponents message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	let stateUpdated = false;
	jointAccountClient.OnStateUpdated(() => {
		stateUpdated = true;
	});

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return (
		message === testForeignRPointHex
		&& signature === testSignatureHex
	); }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	jointAccountClient.blocksInitiated = [hashOfTestBlock];

	mockSessionClient.EmitMockEvent(EventTypes.ProvideRPoint, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		RPoint: testForeignRPointHex,
		Signature: testSignatureHex
	}});

	let RPoints = {};
	RPoints[testForeignPublicKeyHex] = testForeignRPointHex;
	RPoints[testMyPublicKeyHex] = testMyRPointHex;

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.RequestForSignatureContribution,
		Data: {
			MessageToSign: hashOfTestBlock,
			RPoints: RPoints
		}
	}));

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideSignatureContribution,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: hashOfTestBlock,
			SignatureContribution: testMySignatureContributionHex,
			Signature: testSignatureHex
		}
	}));
});

test('When final verified RPoint is received and matches commitment, but I am not the initiator, then request SignatureComponents message is not sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';

	let stateUpdated = false;
	jointAccountClient.OnStateUpdated(() => {
		stateUpdated = true;
	});

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return (
		message === testForeignRPointHex
		&& signature === testSignatureHex
	); }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ProvideRPoint, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		RPoint: testForeignRPointHex,
		Signature: testSignatureHex
	}});

	let RPoints = {};
	RPoints[testForeignPublicKeyHex] = testForeignRPointHex;
	RPoints[testMyPublicKeyHex] = testMyRPointHex;

	t.false(mockSessionClient.GetEventSent({
		EventType: EventTypes.RequestForSignatureContribution,
		Data: {
			MessageToSign: hashOfTestBlock,
			RPoints: RPoints
		}
	}));
});

test('When Signature Contribution is received, and is the last required contribution, then PublishBlock is called', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	setUpOwnPrivateKey(jointAccountClient);

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return (
		message === testForeignSignatureContributionHex
		&& signature === testSignatureHex
		&& pubKey === testForeignPublicKeyHex
	); }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';
	jointAccountClient.transactionsApproved = [{Hash: hashOfTestBlock, Block: {}}];

	jointAccountClient.blocksInitiated = [hashOfTestBlock];

	mockSessionClient.EmitMockEvent(EventTypes.ProvideSignatureContribution, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		SignatureContribution: testForeignSignatureContributionHex,
		Signature: testSignatureHex
	}});

	t.true(mockNanoNodeClient.GetMethodCallOccurred({'Name': 'ProcessBlock'}));
});

test('When Signature Contribution is received, and is NOT the last required contribution, then PublishBlock is not called', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	setUpOwnPrivateKey(jointAccountClient);

	mockBlockSigner.VerifyMessageSingle = (message, signature, pubKey) => { return (
		message === testForeignSignatureContributionHex
		&& signature === testSignatureHex
	); }

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex
	}});

	mockSessionClient.EmitMockEvent(EventTypes.ReadyToUseJointAccount, {Data: {
		PubKey: testForeignPublicKeyHex2
	}});

	let hashOfTestBlock = '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097';
	mockSessionClient.EmitMockEvent(EventTypes.ProvideSignatureContribution, {Data: {
		PubKey: testForeignPublicKeyHex,
		MessageToSign: hashOfTestBlock,
		SignatureContribution: testForeignSignatureContributionHex,
		Signature: testSignatureHex
	}});

	t.false(mockNanoNodeClient.GetMethodCallOccurred({'Name': 'ProcessBlock'}));
});

test('When account is scanned, then expected data structure is returned', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let testAddress = 'nano_3jbccn3ryy9dfnwwt81b3gb5zk8e1o8ten4po5ixx6s9odsg145bhxao6a1s';

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	await jointAccountClient.ScanAddress(testAddress);

	t.deepEqual({
		JointAccountCurrentBalance: '185.47359553',
		JointAccountPendingBlocks: [
			{
				Amount: '0.01',
				Hash: 'CE3140A84DAED77B796790EA9799E0DE8BCF5E0147540E81816C0AC73776EE8D',
				SenderAccount: 'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg'
			}
		]
	}, state);
});

test('When account is scanned but has no open block, then expected data structure is returned', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let testAddress = 'nano_3jbccn3ryy9dfnwwt81b3gb5zk8e1o8ten4po5ixx6s9odsg145bhxao6a1s';

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	mockNanoNodeClient.GetAccountInfo = (address) => {
		return {
			error: "Account not found"
		};
	};

	await jointAccountClient.ScanAddress(testAddress);

	t.deepEqual({
		JointAccountCurrentBalance: '0',
		JointAccountPendingBlocks: [
			{
				Amount: '0.01',
				Hash: 'CE3140A84DAED77B796790EA9799E0DE8BCF5E0147540E81816C0AC73776EE8D',
				SenderAccount: 'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg'
			}
		]
	}, state);
});

test('When ReceivePendingBlocks is called, then correct ProposeJointAccountTransaction message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let testAddress = 'nano_3jbccn3ryy9dfnwwt81b3gb5zk8e1o8ten4po5ixx6s9odsg145bhxao6a1s';

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	await jointAccountClient.ReceivePendingBlocks(testAddress);

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProposeJointAccountTransaction,
		Data: {
			Block: {
				account: "nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr",
				balance: "106000000000000000000000000",
				link: "E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C",
				link_as_account: "xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy",
				previous: "0000000000000000000000000000000000000000000000000000000000000000",
				representative: "nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
				signature: null,
				type: "state",
				work: "77226980634b997b"
			},
			Hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B',
			Amount: '0.01',
			OtherAccount: 'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg',
			IsSend: false
		}
	}));

	t.is(1, state.TransactionsApproved.length);
});

test('When ReceivePendingBlocks is called, then correct ProvideRCommitment message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let testAddress = 'nano_3jbccn3ryy9dfnwwt81b3gb5zk8e1o8ten4po5ixx6s9odsg145bhxao6a1s';

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	await jointAccountClient.ReceivePendingBlocks(testAddress);

	// let blockData = {
	// 	Block: {
	// 		account: "nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr",
	// 		balance: "106000000000000000000000000",
	// 		link: "E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C",
	// 		link_as_account: "xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy",
	// 		previous: "0000000000000000000000000000000000000000000000000000000000000000",
	// 		representative: "nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
	// 		signature: null,
	// 		type: "state",
	// 		work: "77226980634b997b"
	// 	},
	// 	Hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
	// };

	await jointAccountClient.ReceivePendingBlocks('nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr');

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideRCommitment,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B',
			RCommitment: testMyRCommitmentHex,
			Signature: testSignatureHex
		}
	}));
});

test('When SendFunds is called, then correct ProposeJointAccountTransaction message is sent', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let testAddress = 'nano_1khyr3entumzg3154dk13xho73gdc9xhdqegp68cugr4k7a7jm9q9oqw3b18';
	let testDestinationAddress = 'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg';
	let testAmount = 1;

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	await jointAccountClient.SendFunds(testAddress, testDestinationAddress, testAmount);

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProposeJointAccountTransaction,
		Data: {
			// this is mock data, not intended to match inputs
			Block: {
				account: "nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr",
				balance: "106000000000000000000000000",
				link: "E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C",
				link_as_account: "xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy",
				previous: "0000000000000000000000000000000000000000000000000000000000000000",
				representative: "nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
				signature: null,
				type: "state",
				work: "77226980634b997b"
			},
			Hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B',
			Amount: testAmount,
			OtherAccount: 'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg',
			IsSend: true
		}
	}));

	t.is(1, state.TransactionsApproved.length);

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideRCommitment,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B',
			RCommitment: testMyRCommitmentHex,
			Signature: testSignatureHex
		}
	}));
});

test('When ProposeJointAccountTransaction message is received, then new proposed transactions are added to state.', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	let blockData = {
		Block: {
			account: "nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr",
			balance: "106000000000000000000000000",
			link: "E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C",
			link_as_account: "xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy",
			previous: "0000000000000000000000000000000000000000000000000000000000000000",
			representative: "nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
			signature: null,
			type: "state",
			work: "77226980634b997b"
		},
		Hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
	};

	mockSessionClient.EmitMockEvent(EventTypes.ProposeJointAccountTransaction, {Data: blockData});

	t.deepEqual(state, {
		TransactionsWaitingForApproval: [blockData]
	});
});

test('When ApproveTransactions is called, then RCommitment is sent for all block hashes.', async t => {
	let [jointAccountClient, mockSessionClient, mockAddressFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner] = getTestObjects();

	let state = {};
	jointAccountClient.OnStateUpdated((updatedState) => {
		state = updatedState;
	});

	let blockData = {
		Block: {
			account: "nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr",
			balance: "106000000000000000000000000",
			link: "E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C",
			link_as_account: "xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy",
			previous: "0000000000000000000000000000000000000000000000000000000000000000",
			representative: "nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
			signature: null,
			type: "state",
			work: "77226980634b997b"
		},
		Hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
	};

	mockSessionClient.EmitMockEvent(EventTypes.ProposeJointAccountTransaction, {Data: blockData});

	jointAccountClient.ApproveTransactions(['A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B']);

	t.true(mockSessionClient.GetEventSent({
		EventType: EventTypes.ProvideRCommitment,
		Data: {
			PubKey: testMyPublicKeyHex,
			MessageToSign: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B',
			RCommitment: testMyRCommitmentHex,
			Signature: testSignatureHex
		}
	}));

	t.deepEqual(state, {
		TransactionsApproved: [blockData],
		TransactionsWaitingForApproval: []
	});
});

let getTestObjects = () => {
	let mockSessionClient = new MockSessionClient();
	let mockAccountFinder = new MockStandardClass();
	let mockNanoNodeClient = new MockStandardClass();
	let mockBlockBuilder = new MockStandardClass();
	let mockBlockSigner = new MockStandardClass();

	setUpMockAccountFinder(mockAccountFinder);
	setUpMockNanoNodeClient(mockNanoNodeClient);
	setUpMockBlockBuilder(mockBlockBuilder);
	setUpMockBlockSigner(mockBlockSigner);

	let factory = new Factory('test');

	let jointAccountClient = new JointAccountClient(
		mockSessionClient,
		mockAccountFinder,
		mockNanoNodeClient,
		mockBlockBuilder,
		mockBlockSigner,
		factory.GetSignatureDataCodec()
	);

	jointAccountClient.SetUp();

	return [jointAccountClient, mockSessionClient, mockAccountFinder, mockNanoNodeClient, mockBlockBuilder, mockBlockSigner];
}

let getSignatureDataCodec = () => {
	let factory = new Factory('test');
	return factory.GetSignatureDataCodec();
}

let setUpMockAccountFinder = (mockAccountFinder) => {
	mockAccountFinder.GetPrivateKeyForAccount = (accountSeed, nanoAddress) => {
		return 'test_private_key_for_address';
	};
};

let setUpMockNanoNodeClient = (mockNanoNodeClient) => {
	mockNanoNodeClient.GetAccountInfo = async (account) => {
		return {
			frontier: "C023A4C6E10B056340CF9999F2C1738047BE740A8E0B7EC262E7E9B180CDB754",
			open_block: "B70A6D2A2A1F945F51F9B81BC12E17C9AF337CAC95BEBA07293BCB2AA71E060E",
			representative_block: "C023A4C6E10B056340CF9999F2C1738047BE740A8E0B7EC262E7E9B180CDB754",
			balance: "185473595530000000000000000000000",
			modified_timestamp: "1586538841",
			block_count: "21",
			account_version: "1",
			confirmation_height: "21",
			representative: "nano_1natrium1o3z5519ifou7xii8crpxpk8y65qmkih8e8bpsjri651oza8imdd"
		};
	};

	mockNanoNodeClient.GetPendingBlocks = async (account) => {
		return {
			"blocks": [
				"CE3140A84DAED77B796790EA9799E0DE8BCF5E0147540E81816C0AC73776EE8D"
			]
		};
	};

	mockNanoNodeClient.GetBlocksInfo = async (blockHashes) => {
		return {
			blocks: {
				"CE3140A84DAED77B796790EA9799E0DE8BCF5E0147540E81816C0AC73776EE8D": {
					"block_account": "nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg",
					"amount": "10000000000000000000000000000",
					// "amount_decimal": "0.01",
					"balance": "185463595530000000000000000000000",
					// "balance_decimal": "185.46359553",
					// "height": "22",
					// "local_timestamp": "1589148352",
					// "confirmed": "true",
					// "contents": "{\n    \"type\": \"state\",\n    \"account\": \"nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg\",\n    \"previous\": \"C023A4C6E10B056340CF9999F2C1738047BE740A8E0B7EC262E7E9B180CDB754\",\n    \"representative\": \"nano_1natrium1o3z5519ifou7xii8crpxpk8y65qmkih8e8bpsjri651oza8imdd\",\n    \"balance\": \"185463595530000000000000000000000\",\n    \"balance_decimal\": \"185.46359553\",\n    \"link\": \"7812DDBB2A6CC8DE9350B9EEF979D580DA661293D2B00B7A2681BB2199731ACA\",\n    \"link_as_account\": \"nano_1y1kupxknu8autbo3ghgz7wxd18terbb9noi3fx4f1fu68eq88pcbksfc68z\",\n    \"signature\": \"F38DDCF0489F0010BA6F0FEDD5B038B950F11A9646D43795484FFD958265D7BE8D00980A0606EA9FC24B49ADF0C14C6AE91C38B9B53E7E6C360AC42787380504\",\n    \"work\": \"6df42312c4473aea\"\n}\n",
					"subtype": "send"
				}
			}
		};
	};

	mockNanoNodeClient.GetWork = async (hash) => {
	};

	mockNanoNodeClient.ProcessBlock = (function (block) {
		this.LogMethodCall('ProcessBlock', arguments);
	}).bind(mockNanoNodeClient);
};

let setUpMockBlockBuilder = (mockBlockBuilder) => {
	mockBlockBuilder.GetUnsignedReceiveBlock = (receivingNanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, pendingBlockHash) => {
		return {
			block: {
				account: 'nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr',
				balance: '106000000000000000000000000',
				link: 'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C',
				link_as_account: 'xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy',
				previous: '0000000000000000000000000000000000000000000000000000000000000000',
				representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
				signature: null,
				type: 'state',
				work: '77226980634b997b'
			},
			hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
		};
	};

	mockBlockBuilder.GetUnsignedSendBlock = (sendingNanoAddress, previousBlockHash, repNodeAddress, newBalanceAmountInRaw, destinationNanoAddress) => {
		return {
			block: {
				account: 'nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr',
				balance: '106000000000000000000000000',
				link: 'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C',
				link_as_account: 'xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy',
				previous: '0000000000000000000000000000000000000000000000000000000000000000',
				representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
				signature: null,
				type: 'state',
				work: '77226980634b997b'
			},
			hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
		};
	};
};

let setUpMockBlockSigner = (mockBlockSigner) => {
	let codec = getSignatureDataCodec();

	mockBlockSigner.GetNanoAddressForAggregatedPublicKey = (pubKeys) => {
		return 'nano_jointaddress_'+pubKeys.length;
	};

	mockBlockSigner.GetRCommitment = (privateKey, messageToSign) => {
		return codec.DecodeRCommitment(testMyRCommitmentHex);
	}

	mockBlockSigner.GetRPoint = (privateKey, messageToSign) => {
		return codec.DecodeEllipticCurvePoint(testMyRPointHex);
	}

	mockBlockSigner.SignMessageSingle = (message, privateKey) => { let x = new MockStandardClass(); x.toHex = () => {return testSignatureHex;}; return x; }
	mockBlockSigner.SignMessageMultiple = (message, signatureContributions, RPoints) => { let x = new MockStandardClass(); x.toHex = () => {return testSignatureMultipleHex ;};  return x; }
	mockBlockSigner.GetSignatureContribution = (function (privateKey, messageToSign, pubKeys, RPoints) {
		this.LogMethodCall('GetSignatureContribution', arguments);
		return testMySignatureContributionHex;
	}).bind(mockBlockSigner);

	mockBlockSigner.GetPublicKeyFromPrivate = () => {
		let codec = getSignatureDataCodec();
		return codec.DecodePublicKey(testMyPublicKeyHex);
	};

	mockBlockSigner.SortPointsByHexRepresentation = (a, b) => {};
};

let setUpOwnPrivateKey = (jointAccountClient) => {
	let testSeed = '6EA72F4895A8CCDA0B47E92187A152BCC621C148C720DE143ADC20E96AD7B49D';
	let testNanoAddress = 'nano_1hfcqh3gu34s5b6wo6tsc1k88doqaqbq5r34jkt96cq67frynu94wjn6dtbe'; // account index 2
	jointAccountClient.UpdatePrivateKey(testSeed, testNanoAddress);
};
