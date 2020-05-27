import test from 'ava';
import * as NanoCurrency from "nanocurrency";
import Factory from "../../model/Factory";
import AccountTree from "../../model/MixLogic/AccountTree";
import MockStandardClass from "../Mocks/MockStandardClass";

let testAggregatedNanoAddress = 'nano_1cxndmsxfdwy8s18rxxcgcubps4wfa13qrkj7f6ffaxdmb5ntscshi1bhd31';

test('When pubkeys are set, then correct leaf account node for pubkey is found.', async t => {
	let accountTree = getTestObjects();

	accountTree.SetInputPubKeysHex([
			'21F80BDC5AB6C926CA8794D83FFA381F33C08101AAF642817B39A4AB8105E7E2',
			'A103E2D5474DF8A1BA0039EEB4C4C14847C7F5E8C86D080E7F9AEBE6FDD3E101',
			'BB8A385E9816394AB78804CF6279F46F77B8B7D5DF52AEFADC938BD83D829C55',
			'9A43BD42D6A795DF5C379AC6EAA30AEF0C04B100C0D01A5722D32A35FE5F2753',
			'AAAC435821F1DBA79ABD4FC2B10E77DC900C4B0F58D3A23FCAC868A7531A6B6D'
	]);

	let actualNanoAddress = accountTree
		.GetLeafAccountNodeForPublicKeyHex('21F80BDC5AB6C926CA8794D83FFA381F33C08101AAF642817B39A4AB8105E7E2')
		.NanoAddress;

	t.is(testAggregatedNanoAddress, actualNanoAddress);
});

test('When pubkeys are set, and outputs are set, then correct set of nodes is built.', async t => {
	let accountTree = getTestObjects();

	accountTree.SetInputPubKeysHex([
			'21F80BDC5AB6C926CA8794D83FFA381F33C08101AAF642817B39A4AB8105E7E2',
			'A103E2D5474DF8A1BA0039EEB4C4C14847C7F5E8C86D080E7F9AEBE6FDD3E101',
			'BB8A385E9816394AB78804CF6279F46F77B8B7D5DF52AEFADC938BD83D829C55',
			'9A43BD42D6A795DF5C379AC6EAA30AEF0C04B100C0D01A5722D32A35FE5F2753',
			'AAAC435821F1DBA79ABD4FC2B10E77DC900C4B0F58D3A23FCAC868A7531A6B6D'
	]);

	accountTree.SetOutputAccounts([
		{
			NanoAddress: 'nano_1g1tutsoskbpfz7qhymfpmgteeg7o4n38j3z6j81y9gwg8jx3kcsnx7krhd5',
			Amount: 0.4
		},
		{
			NanoAddress: 'nano_1ude767onchizwt13eduwndmcaqu8mbqzckze8mqrfpxtqg9hthcyi81ayyt',
			Amount: 0.3
		},
		{
			NanoAddress: 'nano_11bibi4za8b15gmrzz877qhcpfadcifka5pbkt46rrdownfse57rkf3r17qi',
			Amount: 0.1
		}
	]);

	console.log('Tree Dump:');
	console.log(accountTree.GetTreeDump());

	t.is(accountTree.Digest(), 'asdf');
});

let signatureDataCodec = null;

let getTestObjects = () => {
	let factory = new Factory('test');
	signatureDataCodec = factory.GetSignatureDataCodec();

	let mockBlockSigner = new MockStandardClass();
	mockBlockSigner.GetNanoAddressForAggregatedPublicKey = ((pubKeys) => {
		return testAggregatedNanoAddress;
	});

	return new AccountTree(signatureDataCodec, mockBlockSigner);
}
