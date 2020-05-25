import React, { Component } from 'react';
import {Container, Row, Col, InputGroup, Form, Button, ButtonGroup, Alert, Table} from 'react-bootstrap';
import QRCodeImg from "./QRCodeImg";

class UseMixer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			MyPrivateKeys: [],
			MyPubKeys: [],
			ForeignPubKeys: [],
			MyOutputAccounts: [],
			ForeignOutputAccounts: [],
			MyLeafSendBlocks: [],
			ForeignLeafSendBlocks: [],
			PubKeyListFinalised: false,
			TransactionTree: {'What': 'AccountNode Tree'}
		};

		this.mixPhaseFactory = this.props.MixPhaseFactory;

		this.phaseTracker = this.mixPhaseFactory.BuildPhaseTracker();
		this.phaseTracker.SetStateUpdateEmittedCallback(this.onStateEmitted.bind(this));

		this.onDemoData1Clicked = this.onDemoData1Clicked.bind(this);
		this.onDemoData2Clicked = this.onDemoData2Clicked.bind(this);
		this.onSharePublicKeysClicked = this.onSharePublicKeysClicked.bind(this);
		this.onReadyToMixClicked = this.onReadyToMixClicked.bind(this);
		// this.onScanClicked = this.onScanClicked.bind(this);
		this.onPrivateKeysChanged = this.onPrivateKeysChanged.bind(this);
		this.onOutputAccountsChanged = this.onOutputAccountsChanged.bind(this);
		// this.onApproveAllTransactionsClicked = this.onApproveAllTransactionsClicked.bind(this);

		this.nanoAddressStyle = {
			overflowWrap: "anywhere",
			marginTop: "1em",
			fontSize: "0.8em",
			color: "#999"
		};
	}

	componentDidMount() {
		// this.mixSessionClient.SetUp();
	}

	componentWillUnmount() {
		// this.mixSessionClient.TearDown();
	}

	onStateEmitted(state) {
		this.setState(state, this.notifyPhaseTracker.bind(this));
	}

	notifyPhaseTracker() {
		this.phaseTracker.NotifyOfUpdatedState(this.state)
	}

	onDemoData1Clicked() {
		let myPrivateKeys = [
			'C40FFAFA3A0D954AE057FE3CFAFEAF2D35471E1F49814F45F7B751D78DAF4577',
			'4EB76F58195746851E24C10F131D9F1BE5AB433707F57A66609147669688A227',
			'8494C2401D47BDC7ACA23042C8F201789CDD52CC55A62F0A1F845D6FAE1F834A',
			'12C5ADDE284816ED73C6791C2E2AA47298B4A6C7228C41421E4CA68E52E2655A'
		];

		let myOutputAccounts = [
			{
				NanoAddress: 'nano_1g1tutsoskbpfz7qhymfpmgteeg7o4n38j3z6j81y9gwg8jx3kcsnx7krhd5',
				Amount: 1
			},
			{
				NanoAddress: 'nano_1ude767onchizwt13eduwndmcaqu8mbqzckze8mqrfpxtqg9hthcyi81ayyt',
				Amount: 2
			},
			{
				NanoAddress: 'nano_1djh7q9ax7br86bob4sysk8jxrxs13ypbhcmjbymsth8yjiabzq36ra4sf5f',
				Amount: 3
			},
			{
				NanoAddress: 'nano_39x954678drj1r6addyej3e6dxt9tud1ck7wmcfc1ch95ydqbdcj68qx6dxk',
				Amount: 1
			},
		];

		this.setState({
			MyPrivateKeys: myPrivateKeys,
			MyOutputAccounts: myOutputAccounts
		}, this.notifyPhaseTracker.bind(this));
	}

	onDemoData2Clicked() {
		let myPrivateKeys = [
			'79FF486DADC60D7045CFEB509F9E977CD79D640489F323C07A8ABABF574A2373',
		];

		let myOutputAccounts = [
			{
				NanoAddress: 'nano_11bibi4za8b15gmrzz877qhcpfadcifka5pbkt46rrdownfse57rkf3r17qi',
				Amount: '1'
			}
		];

		this.setState({
			MyPrivateKeys: myPrivateKeys,
			MyOutputAccounts: myOutputAccounts
		}, this.notifyPhaseTracker.bind(this));
	}

	onPrivateKeysChanged(e) {
		let myPrivateKeys = e.target.value.split('\n');

		this.setState({
			MyPrivateKeys: myPrivateKeys
		}, this.notifyPhaseTracker.bind(this));
	}

	onOutputAccountsChanged(e) {
		let myOutputAccounts = e.target.value.split('\n');
		let formattedAccounts = myOutputAccounts.map((accountString) => {
			let parts = accountString.split(',');
			let nanoAddress = parts[0];
			let amount = parts[1];

			return {
				NanoAddress: nanoAddress,
				Amount: amount
			};
		});

		this.setState({
			MyOutputAccounts: formattedAccounts
		}, this.notifyPhaseTracker.bind(this));
	}

	onSharePublicKeysClicked() {
		this.phaseTracker.ExecutePhases(this.state);
	}

	onReadyToMixClicked() {
		this.phaseTracker.ExecutePhases(this.state);
	}

	// async onScanClicked() {
	// 	await this.jointAccountClient.ScanAddress(this.state.JointNanoAddress);
	// }
	//
	// async onApproveAllTransactionsClicked() {
	// 	let waiting = this.state.TransactionsWaitingForApproval;
	// 	let alreadyApproved = this.state.TransactionsApproved;
	//
	// 	let hashes = waiting.map((transaction) => {
	// 		return transaction.Hash;
	// 	});
	//
	// 	let newApproved = alreadyApproved.concat(waiting);
	//
	// 	this.setState({
	// 		TransactionsApproved: newApproved,
	// 		TransactionsWaitingForApproval: []
	// 	});
	//
	// 	this.jointAccountClient.ApproveTransactions(hashes);
	// }

	getValueOrUnknown(value, unknownValue) {
		unknownValue = unknownValue || 'Unknown (click scan when ready)'
		return (value !== null) ? value : unknownValue;
	}

	formatPendingBlocks(blocks) {
		if (!blocks) {
			return 'Unknown';
		}

		if (blocks.length === 0) {
			return 'None';
		}

		return (
			<ul>
				{blocks.map((block) => {
					return (<li key={block.Hash}>{block.Amount} from {block.SenderAccount}</li>);
				})}
			</ul>
		);
	}

	getTransactionTree(transactionTree) {
		return (
			<Table striped bordered hover>
				<tbody>
				<tr>
					<td>{JSON.stringify(transactionTree)}</td>
				</tr>
					{/*{transactionTree.map((transaction) => {*/}
					{/*	console.log('AccountNode:');*/}
					{/*	console.log(transaction);*/}
					{/*	let tofrom = (transaction.IsSend ? 'to' : 'from');*/}

					{/*	return (*/}
					{/*		<tr key={transaction.Hash}>*/}
					{/*			<td>{transaction.Amount} {tofrom} {transaction.OtherAccount}</td>*/}
					{/*		</tr>*/}
					{/*	);*/}
					{/*})}*/}
				</tbody>
			</Table>
		);
	}

	render() {
		let isHidden = {display: 'none'};
		let isVisible = {};
		let internalWalletData = {
			backgroundColor: '#000',
			paddingTop: '1rem',
			paddingBottom: '1rem',
			paddingLeft: '2rem',
			paddingRight: '2rem',
			marginBottom: '2rem'
		};

		return (
			<Container>
				<div style={internalWalletData}>
					<div><span style={{color: '#fff'}}>Internal Wallet Data (Never Broadcast)</span></div>
					<Row className="justify-content-sm-center">
						<Col>
							<InputGroup className="mb-3">
								<Form.Control
									as="textarea"
									rows="4"
									placeholder="Private keys for input accounts (one per line)..."
									aria-label="Input private keys"
									onChange={this.onPrivateKeysChanged}
									value={this.state.MyPrivateKeys.join('\n')}
								/>
							</InputGroup>
						</Col>
					</Row>
				</div>
				<Row>
					<Col>
						<InputGroup className="mb-3">
							<Form.Control
								as="textarea"
								rows="4"
								placeholder="New accounts (one per line, format: nano_xyz123,amount)..."
								aria-label="Output Nano addresses"
								onChange={this.onOutputAccountsChanged}
								value={this.state.MyOutputAccounts.map((outputAccount) => {
									return outputAccount.NanoAddress+','+outputAccount.Amount;
								}).join('\n')}
							/>
						</InputGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<Button onClick={this.onSharePublicKeysClicked}>Share Public Keys</Button>
					</Col>
					<Col>
						<Button onClick={this.onDemoData1Clicked}>Demo Data 1</Button>
					</Col>
					<Col>
						<Button onClick={this.onDemoData2Clicked}>Demo Data 2</Button>
					</Col>
				</Row>
				<Row><Col>&nbsp;</Col></Row>
				<Row style={{marginBottom: '1em'}}>
					<Col>
						<Button onClick={this.onReadyToMixClicked}>Ready to Mix</Button>
					</Col>
					<Col>
						<Button onClick={this.onApproveMixPlanClicked} variant="success">Approve Mix Plan</Button>
					</Col>
					<Col>
						<Button onClick={this.onTriggerRefundClicked} variant="danger">Trigger Refund</Button>
					</Col>
				</Row>
				<Row style={{marginBottom: '1em'}}>
					<Col>
						Progress:
					</Col>
				</Row>
				<Row style={{marginBottom: '1em'}}>
					{this.getTransactionTree(this.state.TransactionTree)}
				</Row>
			</Container>
		);
	}
}
export default UseMixer;
