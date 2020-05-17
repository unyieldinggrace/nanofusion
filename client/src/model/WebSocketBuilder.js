import config from "../config";

class WebSocketBuilder {
	buildWebSocket(relativeURLPath, sessionID, onMessageCallback) {
		let socket = new WebSocket(config.baseWebSocketURL + relativeURLPath);

		socket.onopen = function(e) {
			console.log("[open] Connection established");
			console.log("Sending join-session request to server...");
			this.send(JSON.stringify({
				'MessageType': 'JoinSession',
				'SessionID': sessionID
			}));
		};

		socket.onmessage = onMessageCallback;

		socket.onclose = function(event) {
			if (event.wasClean) {
				console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
			} else {
				// e.g. server process killed or network down
				// event.code is usually 1006 in this case
				console.log('[close] Connection died');
			}
		};

		socket.onerror = function(error) {
			console.log(`[error] ${error.message}`);
		};

		return socket;
	}
}

export default WebSocketBuilder;
