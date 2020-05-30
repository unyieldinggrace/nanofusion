import React, { Component } from 'react';
import {Container, Row, Col, InputGroup, Form, Button, ButtonGroup, Alert, Table} from 'react-bootstrap';
import QRCodeImg from "./QRCodeImg";
import NanoAmountConverter from "../../model/Cryptography/NanoAmountConverter";

class UseMixer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			MyPrivateKeys: [],
			MyPubKeys: [],
			ForeignPubKeys: [],
			PubKeyListFinalised: false,
			AccountTree: null,
			MyLeafSendBlocks: [],
			ForeignLeafSendBlocks: [],
			LeafSendBlockAmounts: {},
			MyOutputAccounts: [],
			ForeignOutputAccounts: []
		};

		this.sessionClient = this.props.SessionClient;
		this.mixPhaseFactory = this.props.MixPhaseFactory;
		this.blockSigner = this.props.BlockSigner;

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
	}

	componentWillUnmount() {
		this.sessionClient.UnsubscribeFromAllEvents();
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
				Amount: 0.04
			},
			{
				NanoAddress: 'nano_1ude767onchizwt13eduwndmcaqu8mbqzckze8mqrfpxtqg9hthcyi81ayyt',
				Amount: 0.03
			},
		];

		this.setState({
			MyPrivateKeys: myPrivateKeys,
			MyPubKeys: this.getMyPubKeysFromPrivateKeys(myPrivateKeys),
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
				Amount: 0.01
			}
		];

		this.setState({
			MyPrivateKeys: myPrivateKeys,
			MyPubKeys: this.getMyPubKeysFromPrivateKeys(myPrivateKeys),
			MyOutputAccounts: myOutputAccounts
		}, this.notifyPhaseTracker.bind(this));
	}

	getMyPubKeysFromPrivateKeys(myPrivateKeys) {
		return myPrivateKeys.map((privateKey) => {
			return this.blockSigner.GetPublicKeyFromPrivate(privateKey);
		});
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
		this.setState({
			PubKeyListFinalised: true
		}, this.notifyPhaseTracker.bind(this));
	}

	getValueOrUnknown(value, unknownValue) {
		unknownValue = unknownValue || 'Unknown (click scan when ready)'
		return (value !== null) ? value : unknownValue;
	}

	formatNanoAddress(nanoAddress) {
		let text = nanoAddress.substr(0, 9) + '...' + nanoAddress.substr(61, 4);
		return (<a className="NanoCrawlerLink" href={"https://nanocrawler.cc/explorer/account/"+nanoAddress+"/history"}>{text}</a>)
	}

	getAccountTree(accountTree) {
		if (!accountTree || !accountTree.LeafNodes) {
			return null;
		}

		if (!this.state.MyLeafSendBlocks) {
			return null;
		}

		if (!accountTree.MixNode || !accountTree.MixNode.TransactionPaths.Success.length) {
			return this.getAccountTreePartial(accountTree);
		}

		let rows = [];
		let addNodeCell = (accountNode, nodeRow) => {
			if (!accountNode) {
				return 0;
			}

			if (!rows[nodeRow]) {
				rows[nodeRow] = [];
			}

			let nextRow = nodeRow + 1;
			let colSpan = addNodeCell(accountNode.AccountNodeLeft, nextRow) + addNodeCell(accountNode.AccountNodeRight, nextRow);
			colSpan = (colSpan === 0) ? 1 : colSpan;

			rows[nodeRow].push({
				ColSpan: colSpan,
				NanoAddress: accountNode.NanoAddress,
				Amount: NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(accountNode.MixAmountRaw)
			});

			return colSpan;
		}

		addNodeCell(accountTree.MixNode, 0);
		rows = rows.reverse();

		return (
			<Table striped bordered hover>
				<tbody>
					{rows.map((row, element, rowIndex) => {
						return (<tr key={'TreeRow'+rowIndex}>
							{
								row.map((nodeCell, element, nodeIndex) => {
									return (
										<td key={'NodeCell'+rowIndex+'.'+nodeIndex} colSpan={nodeCell.ColSpan}>
											{this.formatNanoAddress(nodeCell.NanoAddress)}
											<br />
											{nodeCell.Amount}
										</td>);
								})
							}
						</tr>);
					})}
				</tbody>
			</Table>
		);
	}

	getAccountTreePartial(accountTree) {
		return (
			<Table striped bordered hover>
				<tbody>
				<tr>
					{accountTree.LeafNodes.map((accountNode) => {
						let allLeafSendBlocks = this.state.MyLeafSendBlocks.concat(this.state.ForeignLeafSendBlocks);
						allLeafSendBlocks.sort((a, b) => {
							return a.hash.localeCompare(b.hash);
						});

						let sendBlockColumns = [];

						allLeafSendBlocks.forEach((leafSendBlock) => {
							if (leafSendBlock.block.link_as_account === accountNode.NanoAddress) {
								let nanoAddress = leafSendBlock.block.account;
								let balance = NanoAmountConverter.prototype.ConvertRawAmountToNanoAmount(this.state.LeafSendBlockAmounts[leafSendBlock.hash]);

								sendBlockColumns.push((
									<td key={nanoAddress+balance}>
										Account: {this.formatNanoAddress(nanoAddress)}<br />
										Balance: {balance}
									</td>
								));
							}
						});

						return sendBlockColumns.concat();
					})}
				</tr>
				<tr>
					{accountTree.LeafNodes.map((accountNode) => {
						return (
							<td key={accountNode.GetComponentPublicKeysHex().join('\n')} colSpan={accountNode.GetComponentPublicKeysHex().length}>
								{this.formatNanoAddress(accountNode.NanoAddress)}<br />
							</td>
						);
					})}
				</tr>
				</tbody>
			</Table>
		);
	}

	getInputInfoTable() {
		return (
			<Table striped bordered hover>
				<tbody className="MixInputsTableBody">
				<tr>
					<td colSpan="2">Mix Inputs</td>
				</tr>
				<tr>
					<td>Mine</td>
					<td>{this.state.MyPubKeys.length}</td>
				</tr>
				<tr>
					<td>Others</td>
					<td>{this.state.ForeignPubKeys.length}</td>
				</tr>
				</tbody>
			</Table>
		)
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
				<Row className="InputInfoRow">
					{this.getInputInfoTable()}
				</Row>
				<Row className="ProgressRow">
					<Col>
						Progress:
					</Col>
				</Row>
				<Row className="AccountTreeRow">
					{this.getAccountTree(this.state.AccountTree)}
				</Row>
			</Container>
		);
	}
}
export default UseMixer;
