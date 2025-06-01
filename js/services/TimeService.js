export class TimeService {
    constructor(gameState, onTick) {
        this.gameState = gameState;
        this.onTick = onTick;
        this.interval = null;
    }

    start() {
        if (!this.interval && !this.gameState.isPaused) {
            this.interval = setInterval(() => {
                this.tick();
            }, 1000);
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    pause() {
        this.gameState.isPaused = true;
        this.stop();
    }

    resume() {
        this.gameState.isPaused = false;
        this.start();
    }

    togglePause() {
        if (this.gameState.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
        return this.gameState.isPaused;
    }

    tick() {
        if (this.gameState.isPaused) return;

        this.gameState.seconds++;
        
        // Check for period changes
        const periodChanged = this.gameState.updatePeriod();
        
        // Check timeout status
        const timeoutEnded = this.gameState.checkTimeoutStatus();
        
        // Check suspensions
        let suspensionEnded = false;
        for (const team of ['A', 'B']) {
            for (const player of this.gameState.players[team]) {
                if (player.checkSuspensionStatus(this.gameState.seconds)) {
                    suspensionEnded = true;
                }
            }
        }

        // Notify listeners
        if (this.onTick) {
            this.onTick({
                currentTime: this.gameState.seconds,
                periodSeconds: this.gameState.getPeriodSeconds(),
                period: this.gameState.period,
                periodChanged,
                timeoutEnded,
                suspensionEnded,
                timeoutRemaining: this.gameState.getTimeoutRemaining()
            });
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    reset() {
        this.stop();
        this.gameState.reset();
        this.start();
    }
} 