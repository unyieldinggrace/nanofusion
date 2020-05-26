import test from 'ava';
import MixBuildAccountTreePhase from "../../model/Phases/MixBuildAccountTreePhase";
import Factory from "../../model/Factory";
import MockStandardClass from "../Mocks/MockStandardClass";
import AccountTree from "../../model/MixLogic/AccountTree";

let testAggregatedNanoAddress = 'nano_1cxndmsxfdwy8s18rxxcgcubps4wfa13qrkj7f6ffaxdmb5ntscshi1bhd31';

test('When phase is executed, then AccountTree is emitted.', async t => {
	let phase = getTestObjects();

	let receivedAccountTree = null;
	phase.SetEmitStateUpdateCallback((state) => {
		receivedAccountTree = state.AccountTree;
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

	t.true(!!receivedAccountTree);
});

test('When phase is notified of AccountTree in state, then mark completed.', async t => {
	let phase = getTestObjects();

	let receivedAccountTree = null;
	phase.SetEmitStateUpdateCallback((state) => {
		receivedAccountTree = state.AccountTree;
	});

	phase.NotifyOfUpdatedState({
		AccountTree: new AccountTree(null, null)
	});

	t.true(phase.IsComplete());
});

let signatureDataCodec = null;

let getTestObjects = () => {
	let factory = new Factory('test');
	signatureDataCodec = factory.GetSignatureDataCodec();

	let mockBlockSigner = new MockStandardClass();
	mockBlockSigner.GetNanoAddressForAggregatedPublicKey = ((pubKeys) => {
		return testAggregatedNanoAddress;
	});

	return new MixBuildAccountTreePhase(signatureDataCodec, mockBlockSigner);
}
