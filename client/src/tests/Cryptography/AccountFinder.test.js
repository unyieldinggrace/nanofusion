import test from 'ava';
import AccountFinder from "../../model/Cryptography/AccountFinder";
import * as NanoCurrency from "nanocurrency";

test('Check seed is valid.', async t => {
	let accountSeed = '6EA72F4895A8CCDA0B47E92187A152BCC621C148C720DE143ADC20E96AD7B49D';
	t.true(NanoCurrency.checkSeed(accountSeed));
});

test('When NanoCurrency throws an error converting to private key, then return null.', async t => {
	let accountSeed = 'asdf';
	t.false(NanoCurrency.checkSeed(accountSeed));

	let accountSigner = getTestObjects();

	let nanoAddress = 'nano_1hfcqh3gu34s5b6wo6tsc1k88doqaqbq5r34jkt96cq67frynu94wjn6dtbe'; // account index 2
	let privateKey = accountSigner.GetPrivateKeyForAccount(accountSeed, nanoAddress);

	t.is(privateKey, null);
});

test('When searching for account private key, then correct private key is returned.', async t => {
	let accountSigner = getTestObjects();

	let accountSeed = '6EA72F4895A8CCDA0B47E92187A152BCC621C148C720DE143ADC20E96AD7B49D';
	let nanoAddress = 'nano_1hfcqh3gu34s5b6wo6tsc1k88doqaqbq5r34jkt96cq67frynu94wjn6dtbe'; // account index 2

	let privateKey = accountSigner.GetPrivateKeyForAccount(accountSeed, nanoAddress);

	t.is(privateKey, 'FD2D1A566DCFC0B0AB0CDDD8ACBD420078CAC7BEEE6048DA446F78FD82369C85');
});

test('When searching for account private key, when key is not found after 100 cycles, then return null.', async t => {
	let accountSigner = getTestObjects();

	let accountSeed = '6EA72F4895A8CCDA0B47E92187A152BCC621C148C720DE143ADC20E96AD7B49D';
	let nanoAddress = 'nano_14crrbgo8ti6h3wtcqs5bf8y5sb4f9sugao684pbxcp7rk4zzpkwb5i5tqd7'; // account index 101

	let privateKey = accountSigner.GetPrivateKeyForAccount(accountSeed, nanoAddress);

	t.is(privateKey, null);
});

let getTestObjects = () => {
	return new AccountFinder();
}
