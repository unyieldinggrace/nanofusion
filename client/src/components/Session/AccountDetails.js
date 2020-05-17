import React, { Component } from 'react';

class AccountDetails extends Component {
	constructor(props) {
		super(props);
		this.state = {
			NanoAddress: null,
			Amount: null
		};

		this.onNanoAddressChanged = this.onNanoAddressChanged.bind(this);
		this.onAmountChanged = this.onAmountChanged.bind(this);
	}

	render() {
		return (
			<>
				Current Balance: 0<br />
				Pending Balance: 0.01
				Details of block to receive that pending block...
			</>
		);
	}
}
export default AccountDetails;
