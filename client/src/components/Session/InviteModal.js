import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

class InviteModal extends Component {
	constructor(props) {
		super(props);
		this.state = {};

		this.onAcceptButtonClicked = this.onAcceptButtonClicked.bind(this);
		this.onCloseButtonClicked = this.onCloseButtonClicked.bind(this);
	}

	onAcceptButtonClicked() {
		if (this.props.onAccepted) {
			this.props.onAccepted.call();
		}
	}

	onCloseButtonClicked() {
		if (this.props.onClosed) {
			this.props.onClosed.call();
		}
	}

	render() {
		return (
			<Modal show={this.props.Show} onHide={this.onCloseButtonClicked} centered>
				<Modal.Dialog>
					<Modal.Header closeButton>
						<Modal.Title>{this.props.Title}</Modal.Title>
					</Modal.Header>

					<Modal.Body>
						<p>{this.props.children}</p>
					</Modal.Body>

					<Modal.Footer>
						<Button onClick={this.onCloseButtonClicked} variant="secondary">{this.props.CloseButtonText}</Button>
						<Button onClick={this.onAcceptButtonClicked} variant="success">{this.props.AcceptButtonText}</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal>
		);
	}
}
export default InviteModal;
