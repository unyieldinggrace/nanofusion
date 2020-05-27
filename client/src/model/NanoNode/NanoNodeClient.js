import * as axios from 'axios';
import * as NanoCurrency from 'nanocurrency';

class NanoNodeClient {
	constructor(nodeEndpoint) {
		this.NANO_NODE_ENDPOINT = nodeEndpoint;
	}

	async GetAccountInfo(account) {
		return this.getCachedAccountInfo(account);

		// let response = await axios.post(this.NANO_NODE_ENDPOINT+'/api/v2', {
		// 	action: "account_info",
		// 	account: account
		// });
		//
		// return response.data;

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

	getCachedAccountInfo(account) {
		switch (account) {
			case 'nano_1bhjcifu6mpz69a6rx45mc86nibirer8poawh8dq79gnj358maj5z3ae3ipy':
				return {
					account_version: "1",
						balance: "30000000000000000000000000000",
					block_count: "1",
					confirmation_height: "1",
					frontier: "26742E2B88EC16FD5E3937D6074DAB90DBD305894EE60FE08346C39918AB83C4",
					modified_timestamp: "1590469095",
					open_block: "26742E2B88EC16FD5E3937D6074DAB90DBD305894EE60FE08346C39918AB83C4",
					representative_block: "26742E2B88EC16FD5E3937D6074DAB90DBD305894EE60FE08346C39918AB83C4"
				};

			case 'nano_3rgr1bzxxuup939mf4qb4o6oe85johiymq4oriodowuzdn31tqh91reg77fi':
				return {
					account_version: "1",
						balance: "20000000000000000000000000000",
					block_count: "1",
					confirmation_height: "1",
					frontier: "EFF16DBA32883495728B53F32DF598D4E34E2AA5BABCE689E1805BE694946287",
					modified_timestamp: "1590469091",
					open_block: "EFF16DBA32883495728B53F32DF598D4E34E2AA5BABCE689E1805BE694946287",
					representative_block: "EFF16DBA32883495728B53F32DF598D4E34E2AA5BABCE689E1805BE694946287"
				};

			case 'nano_14odeip7msw3hfy75dosmfaotzfiqzaxty4gdekk9z7471i8zm6937upwrw6':
				return {
					account_version: "1",
						balance: "10000000000000000000000000000",
					block_count: "1",
					confirmation_height: "1",
					frontier: "824969E861EDBE63CCD7405BFC58AC6AFDEBEF622D3026EBBF14667BD3E50182",
					modified_timestamp: "1590469100",
					open_block: "824969E861EDBE63CCD7405BFC58AC6AFDEBEF622D3026EBBF14667BD3E50182",
					representative_block: "824969E861EDBE63CCD7405BFC58AC6AFDEBEF622D3026EBBF14667BD3E50182"
				};

			case 'nano_16fz4nztc4wp6ataz9x7fa4xgp1hg49a4ig46xqymmpduqwupj3imy5hhq6c':
				return {
					account_version: "1",
						balance: "10000000000000000000000000000",
					block_count: "1",
					confirmation_height: "1",
					frontier: "C1A70D8F9BC82417D226AB7EEDEDF34C95060A911EB0C99998702D3C434DAED0",
					modified_timestamp: "1590469070",
					open_block: "C1A70D8F9BC82417D226AB7EEDEDF34C95060A911EB0C99998702D3C434DAED0",
					representative_block: "C1A70D8F9BC82417D226AB7EEDEDF34C95060A911EB0C99998702D3C434DAED0",
				};

			case 'nano_3z1scpktndkphq9h3pewktgwxxxjh9ptqcg9midf4fk9wd8wibtfgir1iuoz':
				return {
					account_version: "1",
						balance: "10000000000000000000000000000",
					block_count: "1",
					confirmation_height: "1",
					frontier: "1619D99ABF370DBBE5B74A62E5357A2541D2874416FAF0813EFE2B5F333BD0C5",
					modified_timestamp: "1590467815",
					open_block: "1619D99ABF370DBBE5B74A62E5357A2541D2874416FAF0813EFE2B5F333BD0C5",
					representative_block: "1619D99ABF370DBBE5B74A62E5357A2541D2874416FAF0813EFE2B5F333BD0C5"
				};

			default:
				return {
					"error": "Account not found"
				};
		}
	}
}

export default NanoNodeClient;
