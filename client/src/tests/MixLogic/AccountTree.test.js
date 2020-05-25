import test from 'ava';
import * as NanoCurrency from "nanocurrency";
import Factory from "../../model/Factory";
import AccountTree from "../../model/MixLogic/AccountTree";

test('When.', async t => {
	let phase = getTestObjects();
	let signatureDataCodec = getSignatureDataCodec();

	let receivedState = null;
	phase.SetEmitStateUpdateCallback((state) => {
		receivedState = state;
	});

	phase.Execute({
		MyPubKeys: [
			signatureDataCodec.DecodePublicKey('21F80BDC5AB6C926CA8794D83FFA381F33C08101AAF642817B39A4AB8105E7E2'),
			signatureDataCodec.DecodePublicKey('A103E2D5474DF8A1BA0039EEB4C4C14847C7F5E8C86D080E7F9AEBE6FDD3E101'),
			signatureDataCodec.DecodePublicKey('BB8A385E9816394AB78804CF6279F46F77B8B7D5DF52AEFADC938BD83D829C55'),
			signatureDataCodec.DecodePublicKey('9A43BD42D6A795DF5C379AC6EAA30AEF0C04B100C0D01A5722D32A35FE5F2753')
		],
		ForeignPubKeys:[
			signatureDataCodec.DecodePublicKey('AAAC435821F1DBA79ABD4FC2B10E77DC900C4B0F58D3A23FCAC868A7531A6B6D')
		]
	});

	let expectedAccountTree = new AccountTree();

	t.is(expectedAccountTree.Digest(), receivedState.AccountTree.Digest())
});

let signatureDataCodec = null;

let getTestObjects = () => {
	let factory = new Factory('test');
	signatureDataCodec = factory.GetSignatureDataCodec();

	return new MixBuildAccountTreePhase();
}

let getSignatureDataCodec = () => {
	return signatureDataCodec;
}