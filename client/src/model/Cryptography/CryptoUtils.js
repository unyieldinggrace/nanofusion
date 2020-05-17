class CryptoUtils {

	ByteArrayToHex(byteArray) {
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

	HexToByteArray(hexString) {
		if (!hexString) {
			return new Uint8Array();
		}

		const a = [];
		for (let i = 0; i < hexString.length; i += 2) {
			a.push(parseInt(hexString.substr(i, 2), 16));
		}

		return new Uint8Array(a);
	}

}

export default CryptoUtils;
