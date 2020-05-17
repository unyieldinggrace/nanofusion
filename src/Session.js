const RandomStringGenerator = require('./RandomStringGenerator');

class Session {
	constructor(type) {
		this.type = type;
		this.ID = RandomStringGenerator.prototype.generateRandomString();
		this.clients = [];
		this.nextClientID = 0;
	}

	getNextClientID() {
		this.nextClientID++;
		return this.nextClientID;
	}
}

module.exports = Session;
