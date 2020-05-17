class SessionClient {
	constructor(webSocketBuilder) {
		this.webSocketBuilder = webSocketBuilder;
		this.socket = null;

		this.nextCallbackID = 0;
		this.callbacks = {};
	}

	ConnectToSession(SessionID) {
		this.socket = this.webSocketBuilder.buildWebSocket('/api/joinSession', SessionID, this.onSocketMessage.bind(this));
		return this.socket.ClientID;
	}

	Disconnect() {
		if (this.socket) {
			return this.socket.close();
		}
	}

	SubscribeToEvent(event, callback) {
		if (!this.callbacks[event]) {
			this.callbacks[event] = {};
		}

		let callbackID = this.nextCallbackID;
		this.nextCallbackID++;

		this.callbacks[event][callbackID] = callback;
		return callbackID;
	}

	UnsubscribeFromAllEvents() {
		this.callbacks = {};
	}

	SendEvent(eventType, data) {
		console.log(eventType);
		console.log(data);

		this.socket.send(JSON.stringify({
			'MessageType': 'MessageOtherParticipants',
			'MessageBody': JSON.stringify({
				EventType: eventType,
				Data: data
			})
		}));
	}

/**********************************************************************************************************************/
	// Internal State Functions
	onSocketMessage(event) {
		let message = JSON.parse(event.data);
		console.log('[message] Data received from server:');
		console.log(message);

		if (message.JoinSessionResponse) {
			this.socket.ClientID = message.ClientID;
		}

		if (message.EventType) {
			this.emitEvent(message.EventType, message);
		}
	}

	emitEvent(event, data) {
		if (!this.callbacks[event]) {
			console.log("No callbacks registered for event: "+event);
			return;
		}

		let self = this;
		let keys = Object.keys(this.callbacks[event]);
		keys.forEach(function (key) {
			self.callbacks[event][key](data);
		});
	}

}

export default SessionClient;
