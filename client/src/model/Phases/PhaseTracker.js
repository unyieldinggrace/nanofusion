class PhaseTracker {
	constructor() {
		this.phases = [];
	}

	AddPhase(phase) {
		this.phases.push(phase);
	}

	ExecutePhases() {
		this.phases.forEach((phase) => {
			if (phase.IsReady() && !phase.IsComplete()) {
				phase.OnPhaseCompleted(this.onPhaseCompleted.bind(this));
				phase.Execute();
			}
		});
	}

	onPhaseCompleted() {
		this.ExecutePhases();
	}

}

export default PhaseTracker;
