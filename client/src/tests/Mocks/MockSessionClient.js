import deepEqual from 'deepequal';
import variableDiff from 'variable-diff';

class MockSessionClient {
	constructor() {
		this.sessionID = null;
		this.callbacks = {};
		this.nextCallbackID = 0;
		this.sendEventLog = [];
	}

	ConnectToSession(SessionID) {
		this.sessionID = SessionID;
	}

	Disconnect() {
		this.sessionID = null;
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
		this.sendEventLog.push({
			EventType: eventType,
			Data: data
		});
	}

	EmitMockEvent(event, data) {
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

	GetEventSent(event) {
		let result = false;

		// console.log('Expected Event:');
		// console.log(event);
		// console.log('Logged Events:');

		this.sendEventLog.forEach((loggedEvent) => {
			if (deepEqual(event, loggedEvent)) {
				result = true;
				return false;
			}

			// console.log(variableDiff(event, loggedEvent));
			// console.log(loggedEvent);
		});

		return result;
	}

}

export default MockSessionClient;
