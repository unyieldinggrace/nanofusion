import React, { Component } from 'react';
import { Col, Card } from 'react-bootstrap';

class SessionActionCard extends Component {
	constructor(props) {
		super(props);
		this.state = {};

		this.onCardClickedInternal = this.onCardClickedInternal.bind(this);
	}

	onCardClickedInternal() {
		if (this.props.onCardClicked) {
			this.props.onCardClicked.call();
		}
	}

	render() {
		return (
			<Col xs md={2.5}>
				<Card className='ClickableCard' style={{ width: '12rem', padding: '0.2rem' }} onClick={this.onCardClickedInternal}>
					<Card.Img variant="top" src={this.props.CardImage} />
					<Card.Body>
						<Card.Title>{this.props.CardTitle}</Card.Title>
						<Card.Text>
							{this.props.children}
						</Card.Text>
					</Card.Body>
				</Card>
			</Col>
		);
	}
}
export default SessionActionCard;
