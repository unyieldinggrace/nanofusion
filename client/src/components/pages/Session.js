import React, { Component } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Redirect } from 'react-router-dom';
import ChooseSessionAction from '../Session/ChooseSessionAction';
import Factory from "../../model/Factory";

class Session extends Component {
	constructor(props) {
		super(props);
		this.state = {
			SessionID: this.props.location.state.SessionID,
			RedirectToHome: false,
			ActionComponent: 'ChooseSessionAction'
		};

		let factory = new Factory();
		this.SessionClient = factory.GetSessionClient();
		this.JointAccountClient = factory.GetJointAccountClient();
	}

	componentDidMount() {
		let sessionID = this.state.SessionID;
		this.SessionClient.ConnectToSession(sessionID);
	}

	componentWillUnmount() {
		this.SessionClient.Disconnect();
	}

	render() {
		if (this.state.RedirectToHome) {
			return (
				<Redirect to='/' push />
			);
		}

		let actionComponent;
		switch (this.state.ActionComponent) {
			case 'ChooseSessionAction':
				actionComponent = (<ChooseSessionAction SessionClient={this.SessionClient} JointAccountClient={this.JointAccountClient} />);
				break;
			default:
				break;
		}

		return (
			<div className="App">
				Session View (Session ID: {this.state.SessionID})

				{actionComponent}

				<Container style={{marginTop: '10em'}}>
					<Row>
						<Col>
							Icons made by <a href="https://www.flaticon.com/authors/freepik">Freepik</a> from <a href="http://www.flaticon.com/">www.flaticon.com</a>
						</Col>
					</Row>
				</Container>
				{/*<Participants />*/}
				{/*<SessionLog />*/}
			</div>
		);
	}
}
export default Session;
