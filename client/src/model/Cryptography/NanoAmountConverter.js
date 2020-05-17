import BigNumber from "bignumber.js";

class NanoAmountConverter {

	ConvertNanoAmountToRawAmount(nanoAmount) {
		let bigNumNanoAmount = new BigNumber(nanoAmount);
		let exponent = new BigNumber(30);
		let conversionFactor = new BigNumber(10).pow(exponent);
		return bigNumNanoAmount.times(conversionFactor).toString(10);
	}

	ConvertRawAmountToNanoAmount(rawAmount) {
		let bigNumRawAmount = new BigNumber(rawAmount);
		let exponent = new BigNumber(30);
		let conversionFactor = new BigNumber(10).pow(exponent);
		return bigNumRawAmount.dividedBy(conversionFactor).toString(10);
	}

	AddRawAmounts(rawAmount1, rawAmount2) {
		let bigNumRawAmount1 = new BigNumber(rawAmount1);
		let bigNumRawAmount2 = new BigNumber(rawAmount2);

		return bigNumRawAmount1.plus(bigNumRawAmount2).toString(10);
	}

	SubtractSendAmount(currentBalanceInRaw, amountToSendInRaw) {
		let bigNumCurrentBalance = new BigNumber(currentBalanceInRaw);
		let bigNumAmountToSend = new BigNumber(amountToSendInRaw);

		return bigNumCurrentBalance.minus(bigNumAmountToSend).toString(10);
	}

	GetTransactionAmount(preTransactionBalance, postTransactionBalance) {
		let preTxBigNum = new BigNumber(preTransactionBalance);
		let postTxBigNum = new BigNumber(postTransactionBalance);

		let difference = postTxBigNum.minus(preTxBigNum);
		return this.ConvertRawAmountToNanoAmount(difference.toString(10));
	}

}

export default NanoAmountConverter;
