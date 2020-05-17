import * as axios from 'axios';
import * as NanoCurrency from 'nanocurrency';

class NanoNodeClient {
	constructor(nodeEndpoint) {
		this.NANO_NODE_ENDPOINT = nodeEndpoint;
	}

	async GetAccountInfo(account) {
		let response = await axios.post(this.NANO_NODE_ENDPOINT+'/api/v2', {
			action: "account_info",
			account: account
		});

		return response.data;

		// .then((response) => {
		// 	console.log(response);
		// 	resolve(this.getWorkFromResponse(response));
		// }).catch((error) => {
		// 	console.log(error);
		// 	reject(error);
		// });

		// return {
		// 	frontier: "C023A4C6E10B056340CF9999F2C1738047BE740A8E0B7EC262E7E9B180CDB754",
		// 	open_block: "B70A6D2A2A1F945F51F9B81BC12E17C9AF337CAC95BEBA07293BCB2AA71E060E",
		// 	representative_block: "C023A4C6E10B056340CF9999F2C1738047BE740A8E0B7EC262E7E9B180CDB754",
		// 	balance: "185473595530000000000000000000000",
		// 	modified_timestamp: "1586538841",
		// 	block_count: "21",
		// 	account_version: "1",
		// 	confirmation_height: "21",
		// 	representative: "nano_1natrium1o3z5519ifou7xii8crpxpk8y65qmkih8e8bpsjri651oza8imdd"
		// };

		// return {
		// 	"error": "Account not found"
		// };
	}

	async GetPendingBlocks(account) {
		let response = await axios.post(this.NANO_NODE_ENDPOINT+'/api/v2', {
			action: "pending",
			account: account
		});

		return response.data;

		// return {
		// 	"blocks": [
		// 		"13D9A6D0972DDD0FC80F2E2509211221978A1D913D9583E17D03544FE11E6736"
		// 	]
		// };
	}

	async GetBlocksInfo(blockHashes) {
		let response = await axios.post(this.NANO_NODE_ENDPOINT+'/api/v2', {
			action: "blocks_info",
			hashes: blockHashes
		});

		return response.data;

		// return {
		// 	blocks: {
		// 		"13D9A6D0972DDD0FC80F2E2509211221978A1D913D9583E17D03544FE11E6736": {
		// 			block_account: "nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg",
		// 			amount: "1000000000000000000000000000",
		// 			balance: "185462595530000000000000000000000",
		// 			height: "23",
		// 			local_timestamp: "1589462683",
		// 			confirmed: "true",
		// 			contents: "{\n    \"type\": \"state\",\n    \"account\": \"nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg\",\n    \"previous\": \"CE3140A84DAED77B796790EA9799E0DE8BCF5E0147540E81816C0AC73776EE8D\",\n    \"representative\": \"nano_1natrium1o3z5519ifou7xii8crpxpk8y65qmkih8e8bpsjri651oza8imdd\",\n    \"balance\": \"185462595530000000000000000000000\",\n    \"link\": \"49FEC0594D6E7F7040312E400F5F5285CB51FAF5DD8EB10CADBB02915058CCF7\",\n    \"link_as_account\": \"nano_1khyr3entumzg3154dk13xho73gdc9xhdqegp68cugr4k7a7jm9q9oqw3b18\",\n    \"signature\": \"AC3FFABC11EC7C2D7D014A9A6CCD27E40AF96277FFAB0E38D7B2C4B67D0C3F36A43D302D511A3C18CFE90A2DE816FB001B09C0604FC2803B1D88D87BE8739909\",\n    \"work\": \"105e01ef34c81da6\"\n}\n",
		// 			subtype: "send"
		// 		}
		// 	}
		// };
	}

	async GetWork(workInput) {
		let response = await axios.post(this.NANO_NODE_ENDPOINT+'/api/v2', {
			action: "work_generate",
			hash: workInput
		});

		return response.data;

		// return {
		// 	"hash": "49FEC0594D6E7F7040312E400F5F5285CB51FAF5DD8EB10CADBB02915058CCF7",
		// 	"work": "e7dd1ecdcb31eb47",
		// 	"difficulty": "ffffffc5b7ef671d",
		// 	"multiplier": "1.098118552669357"
		// };
	}

	async ProcessBlock(block, isSend) {
		let accountInfo = await this.GetAccountInfo(block.account);
		let workInput = accountInfo.frontier ? accountInfo.frontier : NanoCurrency.derivePublicKey(block.account);
		let workInfo = await this.GetWork(workInput);
		block.work = workInfo.work;

		console.log('Submitting block to network...');
		console.log({
			action: "process",
			json_block: true,
			subtype: isSend ? 'send' : 'receive',
			block: block
		});

		let response = await axios.post(this.NANO_NODE_ENDPOINT+'/api/v2', {
			action: "process",
			json_block: true,
			subtype: isSend ? 'send' : 'receive',
			block: block
		});

		return response.data;

		// return {
		// 	"hash": "E03D646E37DAE61E4D21281054418EF733CCFB9943B424B36B203ED063340A88"
		// };

	}
}

export default NanoNodeClient;
