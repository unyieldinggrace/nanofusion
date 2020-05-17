import test from 'ava';
import NanoAmountConverter from "../../model/Cryptography/NanoAmountConverter";

test('When nano is converted to raw, then result is correct.', async t => {
	let NanoAmountConverter = getTestObjects();
	let testAmount = 1;

	let result = NanoAmountConverter.ConvertNanoAmountToRawAmount(testAmount);

	t.is('1000000000000000000000000000000', result);
});

test('When raw is converted to nano, then result is correct.', async t => {
	let NanoAmountConverter = getTestObjects();
	let testAmount = '100000000000000000000000000000';

	let result = NanoAmountConverter.ConvertRawAmountToNanoAmount(testAmount);

	t.is('0.1', result);
});

test('When raw amounts are added together, then result is correct.', async t => {
	let NanoAmountConverter = getTestObjects();
	let testAmount1 = '1000000000000000000000000000000';
	let testAmount2 = '500000000000000000000000000000';

	let result = NanoAmountConverter.AddRawAmounts(testAmount1, testAmount2);

	t.is('1500000000000000000000000000000', result);
});

test('When raw amount to send is subtracted from current balance, then result is correct.', async t => {
	let NanoAmountConverter = getTestObjects();
	let currentBalance = '1000000000000000000000000000000';
	let amountToSend = '400000000000000000000000000000';

	let result = NanoAmountConverter.SubtractSendAmount(currentBalance, amountToSend);

	t.is('600000000000000000000000000000', result);
});

test('When GetTransactionAmount is called, then difference between pre-tx and post-tx balance is returned in whole Nano.', async t => {
	let NanoAmountConverter = getTestObjects();
	let testAmount1 = '1000000000000000000000000000000';
	let testAmount2 = '800000000000000000000000000000';

	let result = NanoAmountConverter.GetTransactionAmount(testAmount1, testAmount2);

	t.is('-0.2', result);
});

let getTestObjects = () => {
	return new NanoAmountConverter();
}
