import EventTypes from "../EventTypes";

class BaseClient {
	constructor(sessionClient) {
		this.sessionClient = sessionClient;
		this.onStateUpdatedCallback = null;
	}

	OnStateUpdated(callback) {
		this.onStateUpdatedCallback = callback;
	}

	notifyStateChange(state) {
		if (this.onStateUpdatedCallback) {
			this.onStateUpdatedCallback(state);
		}
	}

}

export default BaseClient;
