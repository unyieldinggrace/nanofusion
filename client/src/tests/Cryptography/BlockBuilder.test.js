import test from 'ava';
import * as NanoCurrency from "nanocurrency";
import BlockBuilder from "../../model/Cryptography/BlockBuilder";

test('When a receive block is created, correct block data is returned.', async t => {
	let blockBuilder = getTestObjects();
	let recipientAddressPrivateKey = '2211ABAE11F9721C550FCEDFC5034CF84CB51327E1545099023098E820D0DB66';
	let recipientAddressPublicKey = NanoCurrency.derivePublicKey(recipientAddressPrivateKey);
	let recipientAddress = NanoCurrency.deriveAddress(recipientAddressPublicKey, {useNanoPrefix: true});

	let repNodeAddress = 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou'; // Nano Foundation #2

	let unsignedReceiveBlock = blockBuilder.GetUnsignedReceiveBlock(
		recipientAddress,
		'E03D646E37DAE61E4D21281054418EF733CCFB9943B424B36B203ED063340A88',
		repNodeAddress,
		'106000000000000000000000000',
		'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C'
	);

	t.deepEqual({
		block: {
			account: recipientAddress,
			balance: '106000000000000000000000000',
			link: 'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C',
			link_as_account: 'xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy',
			previous: 'E03D646E37DAE61E4D21281054418EF733CCFB9943B424B36B203ED063340A88',
			representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
			signature: null,
			type: 'state',
			work: null
		},
		hash: 'FFBC31635A70258C7245A7DE79A92D2FE6F1365EB1E405A5D653DEDD4607DFCB'
	}, unsignedReceiveBlock);
});

test('When a receive block is created for an open block, correct block data is returned.', async t => {
	let blockBuilder = getTestObjects();
	let recipientAddressPrivateKey = '2211ABAE11F9721C550FCEDFC5034CF84CB51327E1545099023098E820D0DB66';
	let recipientAddressPublicKey = NanoCurrency.derivePublicKey(recipientAddressPrivateKey);
	let recipientAddress = NanoCurrency.deriveAddress(recipientAddressPublicKey, {useNanoPrefix: true});

	let repNodeAddress = null; // Nano Foundation #2

	let unsignedReceiveBlock = blockBuilder.GetUnsignedReceiveBlock(
		recipientAddress,
		null /* open block */,
		repNodeAddress,
		'106000000000000000000000000',
		'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C'
	);

	t.deepEqual({
		block: {
			account: recipientAddress,
			balance: '106000000000000000000000000',
			link: 'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C',
			link_as_account: 'xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy',
			previous: '0000000000000000000000000000000000000000000000000000000000000000',
			representative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4', // Nano Foundation #1
			signature: null,
			type: 'state',
			work: null
		},
		hash: '2079072F6DBA1CE36585DB6E38D7323474E9C36DF118FA7DCECBD73EC9CB780E'
	}, unsignedReceiveBlock);
});

test('When a send block is created, correct block data is returned.', async t => {
	let blockBuilder = getTestObjects();
	let senderAddressPrivateKey = '2211ABAE11F9721C550FCEDFC5034CF84CB51327E1545099023098E820D0DB66';
	let senderAddressPublicKey = NanoCurrency.derivePublicKey(senderAddressPrivateKey);
	let senderAddress = NanoCurrency.deriveAddress(senderAddressPublicKey, {useNanoPrefix: true});

	let repNodeAddress = 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou'; // Nano Foundation #2

	let unsignedReceiveBlock = blockBuilder.GetUnsignedSendBlock(
		senderAddress,
		'E03D646E37DAE61E4D21281054418EF733CCFB9943B424B36B203ED063340A88',
		repNodeAddress,
		'106000000000000000000000000',
		'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg'
	);

	t.deepEqual({
		block: {
			account: senderAddress,
			balance: '106000000000000000000000000',
			link: '5A4FF96316AD017665E10E321D5955CE0B315B9F3157C3AB6EBE8FDFE38DE38B',
			link_as_account: 'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg',
			previous: 'E03D646E37DAE61E4D21281054418EF733CCFB9943B424B36B203ED063340A88',
			representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
			signature: null,
			type: 'state',
			work: null
		},
		hash: 'D1C37B34B975A0410FC08F2F6B023A87BB7975CF972BCF2579C84535E1090219'
	}, unsignedReceiveBlock);
});

test('When signing block with single private key, then verification works correctly.', async t => {
	let recipientAddressPrivateKey = '2211ABAE11F9721C550FCEDFC5034CF84CB51327E1545099023098E820D0DB66';
	let recipientAddressPublicKey = NanoCurrency.derivePublicKey(recipientAddressPrivateKey);
	let recipientAddress = NanoCurrency.deriveAddress(recipientAddressPublicKey, {useNanoPrefix: true});

	console.log(recipientAddress);
	console.log(NanoCurrency.derivePublicKey(recipientAddress));

	let blockData = {
		block: {
			account: recipientAddress,
			balance: '106000000000000000000000000',
			link: 'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C',
			link_as_account: 'xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy',
			previous: '0000000000000000000000000000000000000000000000000000000000000000',
			representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
			signature: null,
			type: 'state',
			work: '77226980634b997b' // pre-calculated. Real-world will call web api to get this.
			// work: null
		},
		hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
	};

	let signature = NanoCurrency.signBlock({
		hash: blockData.hash,
		secretKey: recipientAddressPrivateKey
	});

	let blockVerified = NanoCurrency.verifyBlock({
		hash: blockData.hash,
		signature: signature,
		publicKey: recipientAddressPublicKey
	});

	let workValidated = NanoCurrency.validateWork({
		blockHash: blockData.hash,
		work: blockData.block.work
	});

	t.true(blockVerified);
	t.true(workValidated);
});

let getTestObjects = () => {
	return new BlockBuilder();
}
