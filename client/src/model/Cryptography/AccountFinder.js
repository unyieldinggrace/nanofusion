import * as NanoCurrency from 'nanocurrency';

class AccountFinder {
	constructor() {
		this.MAX_UNUSED_ACCOUNTS_TO_CHECK = 100;
	}

	GetPrivateKeyForAccount(accountSeed, nanoAddress) {
		let numUnusedAccount = 0;
		let addressIndex = 0;

		let privateKey;
		let publicKey;
		let address;

		while (true) {
			try {
				privateKey = NanoCurrency.deriveSecretKey(accountSeed, addressIndex);
				publicKey = NanoCurrency.derivePublicKey(privateKey);
				address = NanoCurrency.deriveAddress(publicKey, {useNanoPrefix: true});
			} catch (error) {
				return null;
			}

			if (address === nanoAddress) {
				return privateKey;
			}

			addressIndex++;
			numUnusedAccount++;

			if (numUnusedAccount > this.MAX_UNUSED_ACCOUNTS_TO_CHECK) {
				return null;
			}
		}
	}

}

export default AccountFinder;
