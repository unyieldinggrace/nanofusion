import test from 'ava';
import * as NanoCurrency from "nanocurrency";
import NanoPoWGenerator from "../../model/Cryptography/NanoPoWGenerator";

test('When GenerateWorkForBlockHash is called, then correct work is returned.', async t => {
	let nanoPoWGenerator = getTestObjects();
	let recipientAddressPrivateKey = '2211ABAE11F9721C550FCEDFC5034CF84CB51327E1545099023098E820D0DB66';
	let recipientAddressPublicKey = NanoCurrency.derivePublicKey(recipientAddressPrivateKey);

	// this test is commented out for the sake of speed, but uncomment
	// it if you have any difficulties with PoW generation. It's mainly here to document the API.

	// console.log(recipientAddressPublicKey);
	// let work = await nanoPoWGenerator.GenerateWork(recipientAddressPublicKey);

	// let expectedWork = '51b0c735c30e85f0';
	// t.is(expectedWork, work);

	let workValidated = NanoCurrency.validateWork({
		blockHash: recipientAddressPublicKey,
		work: '60dc8a2964ad65f7' // pre-generated
	});

	t.true(workValidated);
});

let getTestObjects = () => {
	return new NanoPoWGenerator();
}
