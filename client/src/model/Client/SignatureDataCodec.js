import * as BN from 'bn.js';

class SignatureDataCodec {
	constructor(cryptoUtils, ec) {
		this.cryptoUtils = cryptoUtils;
		this.ec = ec;
	}

	EncodePublicKey(publicKey) {
		return this.EncodeEllipticCurvePoint(publicKey);
	}

	DecodePublicKey(publicKeyHex) {
		return this.DecodeEllipticCurvePoint(publicKeyHex);
	}

	EncodeRCommitment(RCommitment) {
		return this.EncodeBigNum(RCommitment);
	}

	DecodeRCommitment(RCommitmentHex) {
		return this.DecodeBigNum(RCommitmentHex);
	}

	EncodeRPoint(RPoint) {
		return this.EncodeEllipticCurvePoint(RPoint);
	}

	DecodeRPoint(RPointHex) {
		return this.DecodeEllipticCurvePoint(RPointHex);
	}

	EncodeSignatureContribution(signatureContribution) {
		return this.EncodeBigNum(signatureContribution);
	}

	DecodeSignatureContribution(signatureContributionHex) {
		return this.DecodeBigNum(signatureContributionHex);
	}

	EncodeEllipticCurvePoint(pubKeyPoint) {
		return this.cryptoUtils.ByteArrayToHex(this.ec.encodePoint(pubKeyPoint));
	}

	DecodeEllipticCurvePoint(pubKeyHex) {
		let byteArray = this.cryptoUtils.HexToByteArray(pubKeyHex);
		let jsArray = Array.from(byteArray);

		return this.ec.decodePoint(jsArray);
	}

	EncodeBigNum(bigNum) {
		return bigNum.toString(16).toUpperCase();
	}

	DecodeBigNum(bigNumHex) {
		return new BN.BN(bigNumHex, 16);
	}

}

export default SignatureDataCodec;
