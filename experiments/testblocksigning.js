const elliptic = require('elliptic');
const blakejs = require('blakejs');
const nanocurrency = require('nanocurrency');

let EdDSA = elliptic.eddsa;
let ec = new EdDSA('ed25519');

let blake2bhashInt = function () {
	let hexInput = '';
	let args = Array.from(arguments);

	for (let i = 0; i < args.length; i++) {
		hexInput = hexInput + byteArrayToHex(args[i]);
	}

	let digest = blakejs.blake2b(hexToByteArray(hexInput));
	return elliptic.utils.intFromLE(digest).umod(ec.curve.n);
};

ec.hashInt = blake2bhashInt;

function getPlayerData(secret) {
	// To prevent key re-use attacks, the zValue should be a random value per-message in production. Here it is derived
	// deterministically to ensure consistent output on repeated runs of this demo program. Consistent output aids in the
	// debugging process.
	let zValue =  byteArrayToHex(blakejs.blake2b(hexToByteArray(secret)));
	let key = ec.keyFromSecret(secret); // hex string, array or Buffer

	return {
		'secretKeyBytes': key.privBytes(),
		'publicKeyBytes': key.pubBytes(),
		'publicKeyPoint': ec.decodePoint(key.pubBytes()),
		'messagePrefix': key.messagePrefix(),
		'zValue': hexToByteArray(zValue),
		'nanoAddress': nanocurrency.deriveAddress(nanocurrency.derivePublicKey(secret), {useNanoPrefix: true})
	};
}

function getSignatureComponentsForPlayer(playerData, message) {
	let r = ec.hashInt(playerData.messagePrefix, message, playerData.zValue);
	let R = ec.g.mul(r);
	let Rencoded = ec.encodePoint(R);
	let t = ec.hashInt(Rencoded);

	return {
		'rHash': r,
		'RPoint': R,
		'RPointCommitment': t
	};
}

function getAggregatedRPoint(RPoints) {
	let aggregatedRPoint = null;

	for (let i = 0; i < RPoints.length; i++) {
		if (aggregatedRPoint === null) {
			aggregatedRPoint = RPoints[i];
		} else {
			aggregatedRPoint = aggregatedRPoint.add(RPoints[i]); // point addition
		}
	}

	return aggregatedRPoint;
}

function getAHashSignatureComponent(playerPublicKeyPoint, pubKeys) {
	let hashArguments = [ec.encodePoint(playerPublicKeyPoint)];

	for (let i = 0; i < pubKeys.length; i++) {
		hashArguments.push(ec.encodePoint(pubKeys[i]));
	}

	return ec.hashInt.apply(ec, hashArguments);
}

function getAggregatedPublicKeyPoint(pubKeys) {
	let sortPointsByHexRepresentation = (point1, point2) => {
		let point1Hex = byteArrayToHex(ec.encodePoint(point1));
		let point2Hex = byteArrayToHex(ec.encodePoint(point2));

		return point1Hex.localeCompare(point2Hex);
	};

	pubKeys.sort(sortPointsByHexRepresentation);

	let aggregatedPublicKeyPoint = null;
	let aHashComponent = null;
	let aggregationComponentPoint = null;

	for (let i = 0; i < pubKeys.length; i++) {
		aHashComponent = getAHashSignatureComponent(pubKeys[i], pubKeys);
		aggregationComponentPoint = pubKeys[i].mul(aHashComponent);

		if (aggregatedPublicKeyPoint === null) {
			aggregatedPublicKeyPoint = aggregationComponentPoint;
		} else {
			aggregatedPublicKeyPoint = aggregatedPublicKeyPoint.add(aggregationComponentPoint); // point addition
		}
	}

	return aggregatedPublicKeyPoint; // need to convert to key?
}

function getKHash(aggregatedRPoint, aggregatedPublicKeyPoint, message) {
	return ec.hashInt(ec.encodePoint(aggregatedRPoint), ec.encodePoint(aggregatedPublicKeyPoint), message);
}

function getSignatureContribution(aggregatedRPoint, pubKeys, message, playerData, sigComponents) {
	let aggregatedPublicKeyPoint = getAggregatedPublicKeyPoint(pubKeys);
	let aHashSignatureComponent = getAHashSignatureComponent(playerData['publicKeyPoint'], pubKeys);
	let kHash = getKHash(aggregatedRPoint, aggregatedPublicKeyPoint, message);

	let signatureContribution = kHash.mul(ec.decodeInt(playerData['secretKeyBytes']));
	signatureContribution = signatureContribution.mul(aHashSignatureComponent);
	signatureContribution = sigComponents['rHash'].add(signatureContribution); // bigint addition
	signatureContribution = signatureContribution.umod(ec.curve.n); // appears to not be needed? Rust implementation doesn't seem to have it, even for single sig.

	return signatureContribution;
}

function getAggregatedSignature(signatureContributions, aggregatedRPoint) {
	let aggregatedSignature = null;

	for (let i = 0; i < signatureContributions.length; i++) {
		if (aggregatedSignature === null) {
			aggregatedSignature = signatureContributions[i];
		} else {
			aggregatedSignature = aggregatedSignature.add(signatureContributions[i]); // bigint addition
		}
	}

	return ec.makeSignature({ R: aggregatedRPoint, S: aggregatedSignature, Rencoded: ec.encodePoint(aggregatedRPoint) });
}

function byteArrayToHex(byteArray) {
	if (!byteArray) {
		return '';
	}

	let hexStr = '';
	for (let i = 0; i < byteArray.length; i++) {
		let hex = (byteArray[i] & 0xff).toString(16);
		hex = hex.length === 1 ? `0${hex}` : hex;
		hexStr += hex;
	}

	return hexStr.toUpperCase();
}

function hexToByteArray (hexString) {
	if (!hexString) {
		return new Uint8Array();
	}

	const a = [];
	for (let i = 0; i < hexString.length; i += 2) {
		a.push(parseInt(hexString.substr(i, 2), 16));
	}

	return new Uint8Array(a);
}

// let blockHash = hexToByteArray('E03D646E37DAE61E4D21281054418EF733CCFB9943B424B36B203ED063340A88'); // hash of test block (from joint-account demo).
let blockHash = hexToByteArray('FC86A202843AA75389383FA0C5ACE814B948B7CB0FBA428CC378ED83B84D9364'); // hash of test block (from mix demo).

// let playerData1 = getPlayerData('0255A76E9B6F30DB3A201B9F4D07176B518CB24212A5A5822ECE9C5C17C4B9B5'); // joint-account demo.
let playerData1 = getPlayerData('4EB76F58195746851E24C10F131D9F1BE5AB433707F57A66609147669688A227'); // 0.02 account (mix demo).
let signatureComponents1 = getSignatureComponentsForPlayer(playerData1, blockHash);

// let playerData2 = getPlayerData('A1D8928B2599FAA13BF96CD07CB8306069C88C9FDF0C8E65E14F8985AC1C1BC9'); // joint-account demo.
let playerData2 = getPlayerData('79FF486DADC60D7045CFEB509F9E977CD79D640489F323C07A8ABABF574A2373'); // 0.01 (solo account, mix demo).
let signatureComponents2 = getSignatureComponentsForPlayer(playerData2, blockHash);

// Adding extra signatories works just fine. But this one is commented out by default so that this file matches the
// output from the NanoFusion video demo.
//
// let playerData3 = getPlayerData('0fed3e2bd78ba62073fef23222b23bd26fd15baf360cda9b55b520be228c3617');
// let signatureComponents3 = getSignatureComponentsForPlayer(playerData3, blockHash);

let nanoAddresses = [
	playerData1.nanoAddress,
	playerData2.nanoAddress,
	// playerData3.nanoAddress,
];

console.log('Signing account nano addresses:');
console.log(nanoAddresses);

let pubKeys = [
	playerData1.publicKeyPoint,
	playerData2.publicKeyPoint,
	// playerData3.publicKeyPoint,
];

let RPoints = [
	signatureComponents1.RPoint,
	signatureComponents2.RPoint,
	// signatureComponents3.RPoint,
];

let aggregatedRPoint = getAggregatedRPoint(RPoints);
let signatureContribution1 = getSignatureContribution(aggregatedRPoint, pubKeys, blockHash, playerData1, signatureComponents1);
let signatureContribution2 = getSignatureContribution(aggregatedRPoint, pubKeys, blockHash, playerData2, signatureComponents2);
// let signatureContribution3 = getSignatureContribution(aggregatedRPoint, pubKeys, blockHash, playerData3, signatureComponents3);

let signatureContributions = [
	signatureContribution1,
	signatureContribution2,
	// signatureContribution3,
];

let aggregatedSignature = getAggregatedSignature(signatureContributions, aggregatedRPoint);

let aggregatedPublicKeyPoint = getAggregatedPublicKeyPoint(pubKeys);
let aggPubKey = ec.keyFromPublic(aggregatedPublicKeyPoint);
let aggPubKeyHex = byteArrayToHex(aggPubKey.pubBytes());
console.log('Aggregate Public Key: ' + aggPubKeyHex);
console.log('Nano address for Agg. Pub Key: ' + nanocurrency.deriveAddress(aggPubKeyHex, {useNanoPrefix: true}));
console.log('Aggegated Signature: ' + aggregatedSignature.toHex());
console.log('Attempting to verify aggregated signature...');
console.log('EC Verification Passed: ' + ec.verify(blockHash, aggregatedSignature, aggPubKey));
console.log('Nano verification passed: '+nanocurrency.verifyBlock({
	hash: byteArrayToHex(blockHash),
	signature: aggregatedSignature.toHex(),
	publicKey: aggPubKeyHex
}));
