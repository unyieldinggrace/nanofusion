import React, { Component } from 'react';
import {Container, Row} from 'react-bootstrap';
import SessionActionCard from './SessionActionCard';
import UseJointAccount from './UseJointAccount';
import UseMixer from './UseMixer';
import InviteModal from "./InviteModal";
import JointAccountEventTypes from "../../model/EventTypes/JointAccountEventTypes";

class ChooseSessionAction extends Component {
	constructor(props) {
		super(props);
		this.state = {
			ChosenAction: 'None',
			ShowJointAccountInviteModal: false,
			UseJointAccountFromInvite: false,
			MixSessionInProgress: false // should this be a prop?
		};

		this.onUseJointAccountClicked = this.onUseJointAccountClicked.bind(this);
		this.onStartMixSessionClicked = this.onStartMixSessionClicked.bind(this);
		this.onChurnFundsClicked = this.onChurnFundsClicked.bind(this);
		this.onEscrowClicked = this.onEscrowClicked.bind(this);
		this.onJointAccountInviteAccepted = this.onJointAccountInviteAccepted.bind(this);
		this.onJointAccountInviteClosed = this.onJointAccountInviteClosed.bind(this);
	}

	onJointAccountInviteAccepted() {
		this.onJointAccountInviteClosed();
		this.setState({UseJointAccountFromInvite: true});
		this.onUseJointAccountClicked();
	}

	onJointAccountInviteClosed() {
		this.setState({ShowJointAccountInviteModal: false});
	}

	onUseJointAccountClicked() {
		console.log('Use joint account');
		this.setState({ChosenAction: 'UseJointAccount'});
	}

	onStartMixSessionClicked() {
		console.log('Start mix session');
		this.setState({ChosenAction: 'UseMixer'});
	}

	onChurnFundsClicked() {
		console.log('Churn funds');
	}

	onEscrowClicked() {
		console.log('Escrow');
	}

	componentDidMount() {
		this.props.SessionClient.SubscribeToEvent(JointAccountEventTypes.ReadyToUseJointAccount, () => {
			this.setState({ShowJointAccountInviteModal: true});
		});
	}

	componentWillUnmount() {
		this.props.SessionClient.UnsubscribeFromAllEvents();
	}

	render() {
		switch (this.state.ChosenAction) {
			case 'UseJointAccount':
				return (<UseJointAccount JointAccountClient={this.props.JointAccountClient} FromInvite={this.state.UseJointAccountFromInvite} />);
			case 'UseMixer':
				return (<UseMixer MixPhaseFactory={this.props.MixPhaseFactory} />);
			default:
				break;
		}

		return (
			<>
			<InviteModal
				Show={this.state.ShowJointAccountInviteModal}
				Title='Use Joint Account'
				onAccepted={this.onJointAccountInviteAccepted}
				onClosed={this.onJointAccountInviteClosed}
				AcceptButtonText='Accept Invite'
				CloseButtonText='Ignore'>
				You have been invited to participate in a joint-account session.
			</InviteModal>

			<Container>
				<Row>
					<SessionActionCard CardTitle="Use Joint Account" CardImage='./icons/joint-account.png' onCardClicked={this.onUseJointAccountClicked}>
						Sign and publish transactions for your joint account. Joint accounts require <em>all</em> members to sign transactions.
					</SessionActionCard>
					<SessionActionCard CardTitle={this.state.MixSessionInProgress ? 'Join Mix Session' : 'Start Mix Session'} CardImage='./icons/mix.png' onCardClicked={this.onStartMixSessionClicked}>
						Increase your privacy by mixing funds from many accounts together. No trusted third-party required.
					</SessionActionCard>
					<SessionActionCard CardTitle="Churn Funds" CardImage='./icons/churn.png' onCardClicked={this.onChurnFundsClicked}>
						Move your funds through a series of intermediate accounts to disconnect them from your identity.
					</SessionActionCard>
					<SessionActionCard CardTitle="Escrow" CardImage='./icons/escrow.png' onCardClicked={this.onEscrowClicked}>
						Give a third party the authority to pass on or refund your Nano, without the ability to steal it.
					</SessionActionCard>
				</Row>
			</Container>
			</>
		);
	}
}
export default ChooseSessionAction;
