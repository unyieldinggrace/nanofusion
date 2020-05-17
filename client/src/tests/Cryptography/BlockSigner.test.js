import test from 'ava';
import BlockSigner from "../../model/Cryptography/BlockSigner";
import * as NanoCurrency from "nanocurrency";
import * as BN from 'bn.js';
import * as elliptic from 'elliptic';
import CryptoUtils from "../../model/Cryptography/CryptoUtils";
import Factory from "../../model/Factory";

test('When message is single-signed, then same message can be single-verified.', async t => {
	let blockSigner = getTestObjects();

	let message = '0123456789ABCDEF';
	let privateKey = 'D0965AD27E3E096F10F0B1775C8DD38E44F5C53A042C07D778E4C2229D296442';
	let publicKey = blockSigner.GetPublicKeyFromPrivate(privateKey);

	let signature = blockSigner.SignMessageSingle(message, privateKey);

	t.true(blockSigner.VerifyMessageSingle(message, signature, publicKey));
});

test('When SignMessageSingle is called, and message is not a hex string, then throw an error.', async t => {
	let blockSigner = getTestObjects();

	let privateKey = 'D0965AD27E3E096F10F0B1775C8DD38E44F5C53A042C07D778E4C2229D296442';
	let publicKey = blockSigner.GetPublicKeyFromPrivate(privateKey);

	let message = new BN.BN('00ffaa', 16);
	t.throws(() => {
		blockSigner.SignMessageSingle(message, privateKey);
	});

	message = '00FFAAXYZ';
	t.throws(() => {
		blockSigner.SignMessageSingle(message, privateKey);
	});

	message = '00FFAA';
	blockSigner.SignMessageSingle(message, privateKey);
});

test('When aggregate public key is created, then expected aggregate key is returned.', async t => {
	let blockSigner = getTestObjects();
	let privateKey1 = '0255A76E9B6F30DB3A201B9F4D07176B518CB24212A5A5822ECE9C5C17C4B9B5';
	let privateKey2 = 'A1D8928B2599FAA13BF96CD07CB8306069C88C9FDF0C8E65E14F8985AC1C1BC9';

	let publicKey1 = blockSigner.GetPublicKeyFromPrivate(privateKey1);
	let publicKey2 = blockSigner.GetPublicKeyFromPrivate(privateKey2);

	let aggregatedPublicKey = blockSigner.GetAggregatedPublicKey([publicKey1, publicKey2]);

	let ec = getEC();
	let aggregatedPublicKeyHex = CryptoUtils.prototype.ByteArrayToHex(ec.encodePoint(aggregatedPublicKey));

	t.is('49FEC0594D6E7F7040312E400F5F5285CB51FAF5DD8EB10CADBB02915058CCF7', aggregatedPublicKeyHex);
});

test('When block is multiple-signed, then the same message can be single-verified by NanoCurrency library.', async t => {
	let blockSigner = getTestObjects();

	let hash = NanoCurrency.hashBlock({
		account: 'nano_3dgj9zw6daepr1qxoa85izzj78zf3jg4e7ad76ontiwho1zqn1tjgozjr9ih',
		previous: '0000000000000000000000000000000000000000000000000000000000000000',
		representative: 'nano_3akecx3appfbtf6xrzb3qu9c1himzze46uajft1k5x3gkr9iu3mw95noss6i',
		balance: '106000000000000000000000000',
		link: 'E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C'
	});

	t.is('8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097', hash);

	let ec = getEC();

	let signatureContributions = [
		new BN.BN('d59a950fb22030dc7237f89d011168775cdc1489ab30a0b65cb08e9c58485a2', 16),
		new BN.BN('a0967587b7aa7501be8ea3da9b5ce29c3185a54c57c373458914812d54e68ba', 16),
		new BN.BN('a605354fcfc63c414359c6626dce7c7b778096256c0710b35e966a8d73df09b', 16),
	];

	let RPoints = [
		ec.decodePoint(Array.from(CryptoUtils.prototype.HexToByteArray('9AF8E9305ADD72A54DA2E0C2F698816C7BEAA9C3660A36200E4E81E4236A2049'))),
		ec.decodePoint(Array.from(CryptoUtils.prototype.HexToByteArray('60AD74A8D2B93340D5E8A7DFCCE1F5B8F987CE2DCACF4B309BE1398DC9238FAF'))),
		ec.decodePoint(Array.from(CryptoUtils.prototype.HexToByteArray('8110B1F749E5008CA81568FC29CB779B2A90AB3ECE1D2311B2D5DCC670613B7D')))
	];

	let signature = blockSigner.SignMessageMultiple(signatureContributions, RPoints);

	t.true(NanoCurrency.verifyBlock({
		hash: '8F835BF3B18AE72CFC31FDBE4BCA3D00EED03FB3083C74CEFB07A80DD4FC9097',
		signature: signature,
		publicKey: 'ADD13FF845A196C02FDAA0C387FF129BED0C5C26150B292B4D438FA83F7A0351'
	}));
});

let getTestObjects = () => {
	let factory = new Factory('test');
	return new BlockSigner(factory.GetCryptoUtils(), factory.GetEllipticCurveProcessor());
}

let getEC = () => {
	let factory = new Factory()
	return factory.GetEllipticCurveProcessor();
}
