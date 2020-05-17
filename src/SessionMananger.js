const Session = require('./Session');

class SessionMananger {
	constructor() {
		this.sessions = {};
	}

	createSession(type) {
		let session = new Session(type);
		this.sessions[session.ID] = session;

		return session;
	}

	joinSession(sessionID, wsClient) {
		let session = this.getSession(sessionID);

		session.clients.push(wsClient);
		let clientID = sessionID+'.'+session.getNextClientID();
		wsClient.ClientID = clientID;
		wsClient.SessionID = sessionID;

		return clientID;
	}

	removeClient(wsClient) {
		let session = this.getSession(wsClient.SessionID);
		let clientIndex = null;
		let searchIndex = 0;
		session.clients.forEach((client) => {
			if (client.ClientID === wsClient.ClientID) {
				clientIndex = searchIndex;
				return false;
			}

			searchIndex++;
		});

		if (clientIndex === null) {
			throw new Error('Client with ID '+wsClient.ClientID+' not found.');
		}

		session.clients.splice(clientIndex, 1);
		if (session.clients.length === 0) {
			console.log('All clients disconnected, ending session...');
			this.endSession(wsClient.SessionID);
		}
	}

	messageAllOtherClients(sessionID, messageBody, wsClient) {
		let session = this.getSession(sessionID);
		let senderClientID = wsClient.ClientID;

		let sendCount = 0;
		session.clients.forEach(function (client) {
			if (client.ClientID !== senderClientID) {
				client.send(messageBody);
				sendCount++;
			}
		});

		return sendCount;
	}

	getSession(sessionID) {
		let session = this.sessions[sessionID];
		if (!session) {
			throw new Error('Session ID not found.');
		}

		return session;
	}

	endSession(sessionID) {
		delete this.sessions[sessionID];
	}
}

module.exports = SessionMananger;
