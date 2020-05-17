import React, { Component } from 'react';
import {Container, Row, Col, InputGroup, FormControl, Button, ButtonGroup, Alert, Table} from 'react-bootstrap';
import QRCodeImg from "./QRCodeImg";

class UseJointAccount extends Component {
	constructor(props) {
		super(props);
		this.state = {
			MyAccountSeed: '',
			MyNanoAddress: '',
			JointNanoAddress: null,
			JointAccountCurrentBalance: null,
			JointAccountPendingBlocks: null,
			NumJointAccountContributors: null,
			ReceivePendingBlocksButtonEnabled: true,
			SendButtonEnabled: true,
			BlockData: null,
			TransactionsWaitingForApproval: [],
			TransactionsApproved: []
		};

		this.jointAccountClient = this.props.JointAccountClient;

		this.jointAccountClient.OnStateUpdated((state) => {
			this.setState(state);
		});

		this.onDemoData1Clicked = this.onDemoData1Clicked.bind(this);
		this.onDemoData2Clicked = this.onDemoData2Clicked.bind(this);
		this.onReadyClicked = this.onReadyClicked.bind(this);
		this.onScanClicked = this.onScanClicked.bind(this);
		this.onAccountSeedChanged = this.onAccountSeedChanged.bind(this);
		this.onNanoAddressChanged = this.onNanoAddressChanged.bind(this);
		this.onDestinationAddressChanged = this.onDestinationAddressChanged.bind(this);
		this.onSendAmountChanged = this.onSendAmountChanged.bind(this);
		this.onReceivePendingBlocksClicked = this.onReceivePendingBlocksClicked.bind(this);
		this.onSendClicked = this.onSendClicked.bind(this);
		this.onApproveAllTransactionsClicked = this.onApproveAllTransactionsClicked.bind(this);

		this.nanoAddressStyle = {
			overflowWrap: "anywhere",
			marginTop: "1em",
			fontSize: "0.8em",
			color: "#999"
		};
	}

	componentDidMount() {
		this.jointAccountClient.SetUp();
	}

	componentWillUnmount() {
		this.jointAccountClient.TearDown();
	}

	onAccountSeedChanged(e) {
		let myAccountSeed = e.target.value;
		this.setState({MyAccountSeed: myAccountSeed});
		this.jointAccountClient.UpdatePrivateKey(myAccountSeed, this.state.MyNanoAddress);
	}

	onNanoAddressChanged(e) {
		let myNanoAddress = e.target.value;
		this.setState({MyNanoAddress: myNanoAddress});
		this.jointAccountClient.UpdatePrivateKey(this.state.MyAccountSeed, myNanoAddress);
	}

	onDemoData1Clicked() {
		let myAccountSeed = 'FF939E8BA1E213E6E599D79D5D7C21974FC8C1E12CA50796D8449653141B1C0F';
		let myNanoAddress = 'nano_1sw9c9aszj7kbwzagk9cmwz49k9muagkbzccc4kb3cf5s1yn9o7yoxbi11ug';

		this.setState({
			MyAccountSeed: myAccountSeed,
			MyNanoAddress: myNanoAddress
		});

		this.jointAccountClient.UpdatePrivateKey(myAccountSeed, myNanoAddress);
	}

	onDemoData2Clicked() {
		let myAccountSeed = 'E22CE53FFDD738EEFA415A7EA7FFF92B49EED4EC59EF655F234E20441388BE16';
		let myNanoAddress = 'nano_1o6q79j8g6qw3d979zwqy9mg6ufo5k43n1md5m1t3myk79yamqy9koy8oxtp';

		this.setState({
			MyAccountSeed: myAccountSeed,
			MyNanoAddress: myNanoAddress
		});

		this.jointAccountClient.UpdatePrivateKey(myAccountSeed, myNanoAddress);
	}

	onReadyClicked() {
		this.jointAccountClient.SignalReady();
	}

	async onScanClicked() {
		await this.jointAccountClient.ScanAddress(this.state.JointNanoAddress);
	}

	onDestinationAddressChanged(e) {
		let destinationAddress = e.target.value;
		this.setState({DestinationAddress: destinationAddress});
	}

	onSendAmountChanged(e) {
		let sendAmount = e.target.value;
		this.setState({SendAmount: sendAmount});
	}

	async onReceivePendingBlocksClicked() {
		await this.jointAccountClient.ReceivePendingBlocks(this.state.JointNanoAddress);
	}

	async onSendClicked() {
		await this.jointAccountClient.SendFunds(this.state.JointNanoAddress, this.state.DestinationAddress, this.state.SendAmount);
	}

	async onApproveAllTransactionsClicked() {
		let waiting = this.state.TransactionsWaitingForApproval;
		let alreadyApproved = this.state.TransactionsApproved;

		let hashes = waiting.map((transaction) => {
			return transaction.Hash;
		});

		let newApproved = alreadyApproved.concat(waiting);

		this.setState({
			TransactionsApproved: newApproved,
			TransactionsWaitingForApproval: []
		});

		this.jointAccountClient.ApproveTransactions(hashes);
	}

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

	formatTransactionsWaitingForApproval(transactions) {
		// transaction looks like this:
		//
		// {
		// 	Block: {
		// 		account: "nano_31f6ggm4xrbyix7qu3wtcnfce3q6qxz43qwp8x3brs67sfr5bam454nksrrr",
		// 			balance: "106000000000000000000000000",
		// 			link: "E84F9EE0E3EA8D45ED7468E11597C33C54F7755E3101689FCF5B80D1C280346C",
		// 			link_as_account: "xrb_3t4hmuig9tnfaqpqat934pdw8h4nyxtowea3f4hwypw1t93a1f5ehspxniuy",
		// 			previous: "0000000000000000000000000000000000000000000000000000000000000000",
		// 			representative: "nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
		// 			signature: null,
		// 			type: "state",
		// 			work: "77226980634b997b"
		// 	},
		// 	Hash: 'A4EBC3DE1974A82941618590A83F83295ABE2C52C6A23140D2AB615DFE4D589B'
		// }

		return (
			<Table striped bordered hover>
				<tbody>
					{transactions.map((transaction) => {
						console.log('Transaction:');
						console.log(transaction);
						let tofrom = (transaction.IsSend ? 'to' : 'from');

						return (
							<tr key={transaction.Hash}>
								<td>{transaction.Amount} {tofrom} {transaction.OtherAccount}</td>
							</tr>
						);
					})}
					<tr>
						<td><Button variant="success" onClick={this.onApproveAllTransactionsClicked}>Approve All</Button></td>
					</tr>
				</tbody>
			</Table>
		);
	}

	render() {
		let isHidden = {display: 'none'};
		let isVisible = {};

		return (
			<Container>
				<Row className="justify-content-sm-center">
					<Col>
						<InputGroup className="mb-3">
							<FormControl
								placeholder="Enter Account Seed..."
								aria-label="Account Seed"
								onChange={this.onAccountSeedChanged}
								value={this.state.MyAccountSeed}
							/>
						</InputGroup>
					</Col>
				</Row>
				<Row className="justify-content-sm-center">
					<Col>
						<InputGroup className="mb-3">
							<FormControl
								placeholder="Enter Nano Address..."
								aria-label="Nano Address"
								onChange={this.onNanoAddressChanged}
								value={this.state.MyNanoAddress}
							/>
						</InputGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<Button onClick={this.onReadyClicked}>Ready</Button>
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
						<Button onClick={this.onScanClicked}>Scan Joint Account</Button>
					</Col>
				</Row>
				<Row className="justify-content-sm-center" style={this.state.JointNanoAddress ? isVisible : isHidden}>
					<Col>
						<QRCodeImg NanoAddress={this.state.JointNanoAddress} />
					</Col>
				</Row>
				<Row className="justify-content-sm-center" style={this.state.JointNanoAddress ? isVisible : isHidden}>
					<Col style={this.nanoAddressStyle}>
						Joint Nano Address: {this.getValueOrUnknown(this.state.JointNanoAddress)}
					</Col>
				</Row>
				<Row className="justify-content-sm-center" style={this.state.JointNanoAddress ? isVisible : isHidden}>
					<Col style={this.nanoAddressStyle}>
						Contributors: {this.getValueOrUnknown(this.state.NumJointAccountContributors)}
					</Col>
				</Row>
				<Row className="justify-content-sm-center" style={this.state.JointNanoAddress ? isVisible : isHidden}>
					<Col style={this.nanoAddressStyle}>
						Current Balance: {this.getValueOrUnknown(this.state.JointAccountCurrentBalance)}
					</Col>
				</Row>
				<Row className="justify-content-sm-center" style={this.state.JointNanoAddress ? isVisible : isHidden}>
					<Col style={this.nanoAddressStyle}>
						Pending Blocks: {this.formatPendingBlocks(this.state.JointAccountPendingBlocks)}
					</Col>
				</Row>
				<Row className="justify-content-sm-center" style={this.state.JointNanoAddress ? isVisible : isHidden}>
					<Col style={this.nanoAddressStyle}>
						<Button variant="success" onClick={this.onReceivePendingBlocksClicked} disabled={!this.state.ReceivePendingBlocksButtonEnabled}>Receive Pending Blocks</Button>
					</Col>
				</Row>
				<Row>
					<Col>&nbsp;</Col>
				</Row>
				<Row className="justify-content-sm-center" style={(this.state.TransactionsWaitingForApproval.length > 0) ? isVisible : isHidden}>
					<Col>
						Transactions waiting for all peers to approve: {this.formatTransactionsWaitingForApproval(this.state.TransactionsWaitingForApproval)}
					</Col>
				</Row>
				<Row>
					<Col>&nbsp;</Col>
				</Row>
				<Row>
					<Col>
						<InputGroup className="mb-3">
							<FormControl
								placeholder="Enter address to send funds to..."
								aria-label="Destination Address"
								onChange={this.onDestinationAddressChanged}
							/>
						</InputGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<InputGroup className="mb-3">
							<FormControl
								placeholder="Enter amount to send..."
								aria-label="Send Amount"
								onChange={this.onSendAmountChanged}
							/>
						</InputGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<Button variant="success" onClick={this.onSendClicked} disabled={!this.state.SendButtonEnabled}>Send</Button>
					</Col>
				</Row>
			</Container>
		);
	}
}
export default UseJointAccount;
