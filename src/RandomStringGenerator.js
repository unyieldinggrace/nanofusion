class RandomStringGenerator {
	generateRandomString(length) {
		length = length ? length : 8;
		let charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let result = "";

		for (var i = 0; i < length; ++i) {
			result += charSet.charAt(Math.round(Math.random() * charSet.length));
		}

		return result;
	}
}

module.exports = RandomStringGenerator;
