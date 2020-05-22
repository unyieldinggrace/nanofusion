import test from 'ava';
import SignatureDataCodec from "../../model/Client/SignatureDataCodec";
import * as BN from 'bn.js';
import Factory from "../../model/Factory";
import SignatureNegotiator from "../../model/Client/SignatureNegotiator";

test('When public key point is encoded, then decoded, result matches original point.', async t => {
	let signatureDataCodec = getTestObjects();
	let privateKey = 'D0965AD27E3E096F10F0B1775C8DD38E44F5C53A042C07D778E4C2229D296442';

	let ec = getEC();
	let keyPair = ec.keyFromSecret(privateKey);
	let publicKey = ec.decodePoint(keyPair.pubBytes());

	let pubKeyHex = signatureDataCodec.EncodeEllipticCurvePoint(publicKey);
	let pubKeyPoint = signatureDataCodec.DecodeEllipticCurvePoint(pubKeyHex);

	t.deepEqual(publicKey, pubKeyPoint);
	t.is(pubKeyHex, signatureDataCodec.EncodeEllipticCurvePoint(pubKeyPoint));
});

let getTestObjects = () => {
	let factory = new Factory('test');

	return new SignatureNegotiator(factory.GetCryptoUtils(), factory.GetEllipticCurveProcessor());
}

let getEC = () => {
	let factory = new Factory('test');
	return factory.GetEllipticCurveProcessor();
}
