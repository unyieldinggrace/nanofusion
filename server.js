const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

let app = express();
const expressWs = require('express-ws')(app);
app = expressWs.app;

const SessionManager = require('./src/SessionMananger');

let NANO_API_ENDPOINT = 'http://nanofusion.casa:7076/api/v2'; // development
// let NANO_API_ENDPOINT = 'http://nano-node:7076/api/v2'; // production
let ALLOWED_ACTIONS = [
	'account_info',
	// 'account_balance',
	'pending',
	'blocks_info',
	'work_generate',
	'process'
];

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Parse JSON post requests
app.use(express.json());

let sessionManager = new SessionManager();

let corsOptions = {
	origin: 'http://localhost:3000'
};

// create a new fusion/joint-account session
app.get('/api/createSession', cors(corsOptions), (req, res) => {
	let newSession = sessionManager.createSession(req.type);

	console.log("Created new session with ID: " + newSession.ID);

	res.json({
		'SessionID': newSession.ID
	});
});

app.post('/api/v2', cors(corsOptions), async (req, res) => {
	if (ALLOWED_ACTIONS.indexOf(req.body.action) === -1) {
		res.json({
			Status: 'Error',
			Message: 'To prevent abuse, the "'+req.body.action+'" action is disabled for this API.'
		});

		return;
	}

	axios.post(NANO_API_ENDPOINT, req.body)
		.then((response) => {
		if (response.status === 200) {
			res.json(response.data);
		} else {
			res.json({
				'Status': response.status,
				'Message': JSON.stringify(response)
			})
		}
	}).catch((error) => {
		console.log(error);
		res.json({
			'Error': 500,
			'Message': 'Could not process request, received error from Nano node: '+error
		});
	});
});

app.ws('/api/joinSession', function (ws, req) {
	ws.on('message', function (msgStr) {
		let msg = JSON.parse(msgStr);
		console.log(msg);

		switch (msg.MessageType) {
			case 'JoinSession':
				let clientID = null;
				try {
					clientID = sessionManager.joinSession(msg.SessionID, ws);
				} catch (error) {
					ws.send(JSON.stringify({
						"Response": "Could not connect to session: " + msg.SessionID
					}));

					ws.close();
					break;
				}

				ws.send(JSON.stringify({
					"JoinSessionResponse": true,
					"Response": "Successfully joined session.",
					"ClientID": clientID
				}));
				break;
			case 'MessageOtherParticipants':
				let sendCount = sessionManager.messageAllOtherClients(ws.SessionID, msg.MessageBody, ws);
				ws.send(JSON.stringify({
					"Response": "Successfully sent message. Recipients: "+sendCount
				}));
				break;
			default:
				ws.send("Received: " + msg);
				break;
		}
	});

	ws.on('close', function () {
		console.log('Dropping client: '+ws.ClientID);
		try {
			sessionManager.removeClient(ws);
		} catch (error) {
			console.log("Could not drop client: "+error);
		}
	});
});

// Handles any requests that don't match the ones above
app.get('*', cors(corsOptions), (req,res) => {
	res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
