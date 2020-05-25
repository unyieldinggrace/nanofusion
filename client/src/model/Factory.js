import * as elliptic from 'elliptic';
import * as blakejs from 'blakejs';
import config from '../config';
import CryptoUtils from "./Cryptography/CryptoUtils";
import JointAccountClient from "./Client/JointAccountClient";
import AccountFinder from "./Cryptography/AccountFinder";
import NanoNodeClient from "./NanoNode/NanoNodeClient";
import BlockBuilder from "./Cryptography/BlockBuilder";
import BlockSigner from "./Cryptography/BlockSigner";
import SessionClient from "./SessionClient";
import WebSocketBuilder from "./WebSocketBuilder";
import SignatureDataCodec from "./Client/SignatureDataCodec";
import MixPhaseFactory from "./Phases/MixPhaseFactory";

class Factory {
	constructor(mode) {
		this.mode = mode || 'production';
		this.ec = null;
		this.cryptoUtils = null;
		this.jointAccountClient = null;
		this.sessionClient = null;
		this.webSocketBuilder = null;
		this.accountFinder = null;
		this.nanoNodeClient = null;
		this.blockBuilder = null;
		this.blockSigner = null;
		this.signatureDataCodec = null;
		this.mixPhaseFactory = null;
	}

	getOrCreate(existing, createFunc, allowedModes) {
		allowedModes = allowedModes || ['production'];
		this.checkMode(allowedModes);
		if (existing === null) {
			return createFunc();
		}

		return existing;
	}

	checkMode(allowedModes) {
		if (allowedModes.indexOf(this.mode) === -1) {
			throw new Error('Must be in one of these modes to create this object through the factory: '+allowedModes.join(', '));
		}
	}

	GetEllipticCurveProcessor() {
		return this.ec = this.getOrCreate(this.ec, this.createEllipticCurveProcessor.bind(this), ['test', 'production']);
	}

	createEllipticCurveProcessor() {
		let cryptoUtils = this.GetCryptoUtils();
		let EdDSA = elliptic.eddsa;
		let ec = new EdDSA('ed25519');

		let blake2bhashInt = (...args) => {
			let hexInput = '';

			for (let i = 0; i < args.length; i++) {
				hexInput = hexInput + cryptoUtils.ByteArrayToHex(args[i]);
			}

			let digest = blakejs.blake2b(this.cryptoUtils.HexToByteArray(hexInput));
			return elliptic.utils.intFromLE(digest).umod(this.ec.curve.n);
		};

		ec.hashInt = blake2bhashInt;
		return ec;
	}

	GetCryptoUtils() {
		return this.cryptoUtils = this.getOrCreate(this.cryptoUtils, this.createCryptoUtils.bind(this), ['test', 'production']);
	}

	createCryptoUtils() {
		return new CryptoUtils();
	}

	GetJointAccountClient() {
		return this.jointAccountClient = this.getOrCreate(this.jointAccountClient, this.createJointAccountClient.bind(this));
	}

	createJointAccountClient() {
		return new JointAccountClient(
			this.GetSessionClient(),
			this.GetAccountFinder(),
			this.GetNanoNodeClient(),
			this.GetBlockBuilder(),
			this.GetBlockSigner(),
			this.GetSignatureDataCodec()
		);
	}

	GetMixPhaseFactory() {
		return this.mixPhaseFactory = this.getOrCreate(this.mixPhaseFactory, this.createMixPhaseFactory.bind(this));
	}

	createMixPhaseFactory() {
		return new MixPhaseFactory(
			this.GetSessionClient()
		);
	}

	GetSessionClient() {
		return this.sessionClient = this.getOrCreate(this.sessionClient, this.createSessionClient.bind(this));
	}

	createSessionClient() {
		return new SessionClient(this.GetWebSocketBuilder());
	}

	GetWebSocketBuilder() {
		return this.webSocketBuilder = this.getOrCreate(this.webSocketBuilder, this.createWebSocketBuilder.bind(this));
	}

	createWebSocketBuilder() {
		return new WebSocketBuilder();
	}

	GetAccountFinder() {
		return this.accountFinder = this.getOrCreate(this.accountFinder, this.createAccountFinder.bind(this));
	}

	createAccountFinder() {
		return new AccountFinder();
	}

	GetNanoNodeClient() {
		return this.nanoNodeClient = this.getOrCreate(this.nanoNodeClient, this.createNanoNodeClient.bind(this));
	}

	createNanoNodeClient() {
		return new NanoNodeClient(config.nanoNodeAPIURL);
	}

	GetBlockBuilder() {
		return this.blockBuilder = this.getOrCreate(this.blockBuilder, this.createBlockBuilder.bind(this));
	}

	createBlockBuilder() {
		return new BlockBuilder();
	}

	GetBlockSigner() {
		return this.blockSigner = this.getOrCreate(this.blockSigner, this.createBlockSigner.bind(this));
	}

	createBlockSigner() {
		return new BlockSigner(this.GetCryptoUtils(), this.GetEllipticCurveProcessor());
	}

	GetSignatureDataCodec() {
		return this.signatureDataCodec = this.getOrCreate(this.signatureDataCodec, this.createSignatureDataCodec.bind(this), ['test', 'production']);
	}

	createSignatureDataCodec() {
		return new SignatureDataCodec(this.GetCryptoUtils(), this.GetEllipticCurveProcessor());
	}

}

export default Factory;
