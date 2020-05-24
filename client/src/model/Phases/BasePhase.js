class BasePhase {
	constructor() {
		this.prerequisitePhases = [];
		this.phaseCompletedCallback = null;
		this.emitStateUpdateCallback = null;

		this.PhaseStatus = {
			READY: 0,
			RUNNING: 1,
			COMPLETED: 2
		};

		this.currentStatus = this.PhaseStatus.READY;
	}

	SetPrerequisitePhases(phases) {
		this.prerequisitePhases = phases;
	}

	SetPhaseCompletedCallback(callback) {
		this.phaseCompletedCallback = callback;
	}

	SetEmitStateUpdateCallback(callback) {
		this.emitStateUpdateCallback = callback;
	}

	async Execute(state) {
		this.currentStatus = this.PhaseStatus.RUNNING;
		this.executeInternal(state);
	}

	executeInternal(state) {
		this.markPhaseCompleted();
	}

	async NotifyOfUpdatedState(state) {
	}

	emitStateUpdate(newState) {
		if (this.emitStateUpdateCallback) {
			this.emitStateUpdateCallback(newState);
		}
	}

	IsReady() {
		if (this.currentStatus !== this.PhaseStatus.READY) {
			return false;
		}

		let result = true;

		this.prerequisitePhases.forEach((phase) => {
			if (!phase.IsComplete()) {
				result = false;
				return false;
			}
		});

		return result;
	}

	IsRunning() {
		return (this.currentStatus === this.PhaseStatus.RUNNING)
	}

	IsComplete() {
		return (this.currentStatus === this.PhaseStatus.COMPLETED);
	}

	markPhaseCompleted() {
		this.currentStatus = this.PhaseStatus.COMPLETED;

		if (this.phaseCompletedCallback) {
			this.phaseCompletedCallback();
		}
	}
}

export default BasePhase;
