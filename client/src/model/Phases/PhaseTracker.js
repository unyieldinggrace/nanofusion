class PhaseTracker {
	constructor() {
		this.phases = [];
		this.stateUpdateEmittedCallback = null;
		this.latestState = null;
	}

	AddPhase(phase) {
		this.phases.push(phase);
	}

	ExecutePhases(state) {
		this.phases.forEach((phase) => {
			if (phase.IsReady() && !phase.IsComplete()) {
				phase.SetPhaseCompletedCallback(this.onPhaseCompleted.bind(this));
				phase.SetEmitStateUpdateCallback(this.onStateUpdateEmitted.bind(this));
				phase.Execute(state);
			}
		});
	}

	SetStateUpdateEmittedCallback(callback) {
		this.stateUpdateEmittedCallback = callback;
	}

	NotifyOfUpdatedState(state) {
		this.latestState = state;

		this.phases.forEach((phase) => {
			phase.NotifyOfUpdatedState(state);
		});
	}

	onPhaseCompleted() {
		this.ExecutePhases(this.latestState);
	}

	onStateUpdateEmitted(newState) {
		if (this.stateUpdateEmittedCallback) {
			this.stateUpdateEmittedCallback(newState);
		}
	}
}

export default PhaseTracker;
