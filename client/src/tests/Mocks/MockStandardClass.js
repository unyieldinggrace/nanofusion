class MockStandardClass {
	constructor() {
		this.methodCallLog = [];
	}

	LogMethodCall(name, args) {
		this.methodCallLog.push({'Name': name, 'Arguments': args});
	}

	GetMethodCallOccurred(methodCall) {
		let result = false;

		this.methodCallLog.forEach((loggedMethodCall) => {
			if (methodCall['Name'] !== loggedMethodCall['Name']) {
				return true;
			}

			if (!methodCall['Arguments']) {
				result = true;
				return false;
			}

			if (JSON.stringify(methodCall) === JSON.stringify(loggedMethodCall)) {
				result = true;
				return false;
			}
		});

		// console.log(this.methodCallLog);
		return result;
	}
}

export default MockStandardClass;
