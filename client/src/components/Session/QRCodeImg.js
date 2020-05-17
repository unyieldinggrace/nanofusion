import React, { Component } from 'react';
import * as QR from 'qrcode-generator';

class QRCodeImg extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		if (!this.props.NanoAddress) {
			return null;
		}

		let typeNumber = 4;
		let errorCorrectionLevel = 'L';
		let qr = QR(typeNumber, errorCorrectionLevel);
		qr.addData(this.props.NanoAddress);
		qr.make();

		return (
			<img src={qr.createDataURL(4)}  alt="QR Code"/>
		);
	}
}
export default QRCodeImg;
