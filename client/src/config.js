export default {
	// need to use port 5000 directly, Chrome doesn't like proxying websocket connections through the dev server
	baseURL: 'http://localhost:5000',
	baseWebSocketURL: 'ws://localhost:5000',
	nanoNodeAPIURL: 'http://nanofusion.casa:7076'
};