class BasePhase {
	constructor(phaseState) {
		this.phaseState = phaseState;
		this.dependencyCallbacks = [];
		this.onPhaseCompletedCallback = null;
		this.onPhaseStateUpdatedCallback = null;
	}

	Execute() {
		this.signalCompleted();
	}

	IsReady() {
		let result = true;

		this.dependencyCallbacks.forEach((callback) => {
			result = result || callback();
		});

		return result;
	}

	IsComplete() {
		return true;
	}

	OnPhaseCompleted(callback) {
		this.onPhaseCompletedCallback = callback;
	}

	OnPhaseStateUpdated(callback) {
		this.onPhaseStateUpdatedCallback = callback;
	}

	signalCompleted() {
		if (this.onPhaseCompletedCallback) {
			this.onPhaseCompletedCallback();
		}
	}

	addDependencyCallback(callback) {
		this.dependencyCallbacks.push(callback);
	}

	updatePhaseState(state) {
		Object.keys(state).forEach((key) => {
			this.phaseState[key] = state[key];
		});

		if (this.onPhaseStateUpdatedCallback) {
			this.onPhaseStateUpdatedCallback();
		}
	}
}

export default BasePhase;
