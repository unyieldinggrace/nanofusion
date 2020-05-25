import React, { Component } from 'react';
import { FormControl, InputGroup, Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import QRCodeImg from "../Session/QRCodeImg";
import YouTube from "react-youtube";

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			SessionID: '',
			RedirectToSession: false
		};

		this.onJoinSessionClicked = this.onJoinSessionClicked.bind(this);
		this.onCreateSessionClicked = this.onCreateSessionClicked.bind(this);

		this.onSessionIDChanged = this.onSessionIDChanged.bind(this);
	}

	async onJoinSessionClicked() {
		this.setState({RedirectToSession: true});
	}

	async onCreateSessionClicked() {
		axios.get(config.baseURL+'/api/createSession')
			.then((response) => {
				this.setState({SessionID: response.data.SessionID});
			});
	}

	onSessionIDChanged(e) {
		this.setState({SessionID: e.target.value});
	}

	render() {
		if (this.state.RedirectToSession) {
			return (
				<Redirect to={{
					pathname: '/session',
					state: {
						SessionID: this.state.SessionID
					}
				}} push />
			);
		}

		return (
			<div className="App">
				<h1>NanoFusion</h1>
				<Container>
					<Row className="justify-content-md-center">
						<Col xs md={6}>
							<InputGroup className="mb-3">
								<FormControl
									placeholder="Enter Session ID..."
									aria-label="Session ID"
									// aria-describedby="basic-addon2"
									onChange={this.onSessionIDChanged}
									value={this.state.SessionID}
								/>
								<InputGroup.Append>
									<Button onClick={this.onJoinSessionClicked}>Join Session</Button>
								</InputGroup.Append>
							</InputGroup>
						</Col>
						<Col xs="auto">
							or
						</Col>
						<Col xs="auto">
							<Button onClick={this.onCreateSessionClicked} variant="success">
								Create Session
							</Button>
						</Col>
					</Row>
					<Row><Col>&nbsp;</Col></Row>
					<Row className="justify-content-sm-center">
						<Col>
								<Alert variant="danger">
									NanoFusion is still alpha software. It works well enough for demonstration purposes,
									but it is known to contain bugs and glitches. Use at your own risk.
								</Alert>
						</Col>
					</Row>
				</Container>
				<Container>
					<Row>
						<Col>
						</Col>
						<Col>
							<a href='https://github.com/unyieldinggrace/nanofusion'>
								GitHub Repo
							</a>
						</Col>
						<Col>
							<a href='https://github.com/unyieldinggrace/nanofusion/blob/master/README.md'>
								Documentation
							</a>
						</Col>
						<Col>
						</Col>
					</Row>
					<Row>
						<Col style={{marginTop: '1rem', fontWeight: 'bold'}}>
							Part 1: Joint Account Demo
						</Col>
					</Row>
					<Row>
						<Col>
							{/*<YouTube videoId="E-m64VPORbw" opts={{height: '390', width: '640'}} />*/}
						</Col>
					</Row>
					<Row>
						<Col style={{marginTop: '1rem', fontWeight: 'bold'}}>
							Part 2: Trustless Mixing (Video Whitepaper)
						</Col>
					</Row>
					<Row>
						<Col>
							{/*<YouTube videoId="CtMMETZcAQY" opts={{height: '390', width: '640'}} />*/}
						</Col>
					</Row>
					<Row style={{marginTop: '5em'}}>
						<Col>
							Donate: nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg
						</Col>
					</Row>
					<Row>
						<Col>
							<QRCodeImg NanoAddress={'nano_1pkhz7jjfda3gsky45jk5oeodmid87fsyecqrgopxhnhuzjrurwd8fdxcqtg'} />
						</Col>
					</Row>
				</Container>
			</div>
		);
	}
}
export default Home;
