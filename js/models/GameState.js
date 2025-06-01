import { gameConfig } from '../config.js';
import { Player } from './Player.js';

export class GameState {
    constructor() {
        this.seconds = 0;
        this.period = '1H';
        this.isPaused = false;
        this.timerInterval = null;
        this.periodDurations = { ...gameConfig.periodDurations };
        
        this.timeouts = {
            A: gameConfig.maxTimeouts,
            B: gameConfig.maxTimeouts
        };
        
        this.isTimeoutActive = false;
        this.timeoutTeam = null;
        this.timeoutStartTime = 0;
        this.timeoutEndTime = 0;
        this.timeoutTimer = null;
        
        this.periodScores = {
            '1H': { A: 0, B: 0 },
            '2H': { A: 0, B: 0 },
            'ET1': { A: 0, B: 0 },
            'ET2': { A: 0, B: 0 }
        };
        
        this.totalScores = { A: 0, B: 0 };
        this.isOnline = false;
        this.matchId = this.generateMatchId();
        this.lastSaved = null;
        
        // Initialize players
        this.players = {
            A: Array(gameConfig.maxPlayers).fill().map((_, i) => new Player(i + 1)),
            B: Array(gameConfig.maxPlayers).fill().map((_, i) => new Player(i + 1))
        };
    }

    generateMatchId() {
        const date = new Date();
        return `match-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6)}`;
    }

    toJSON() {
        return {
            seconds: this.seconds,
            period: this.period,
            timeouts: this.timeouts,
            periodScores: this.periodScores,
            totalScores: this.totalScores,
            players: {
                A: this.players.A.map(p => p.toJSON()),
                B: this.players.B.map(p => p.toJSON())
            },
            lastUpdated: new Date().toISOString()
        };
    }

    static fromData(data) {
        const state = new GameState();
        if (data) {
            state.seconds = data.seconds || 0;
            state.period = data.period || '1H';
            state.timeouts = data.timeouts || { A: gameConfig.maxTimeouts, B: gameConfig.maxTimeouts };
            state.periodScores = data.periodScores || state.periodScores;
            state.totalScores = data.totalScores || { A: 0, B: 0 };
            
            if (data.players) {
                state.players = {
                    A: data.players.A.map(p => Player.fromData(p)),
                    B: data.players.B.map(p => Player.fromData(p))
                };
            }
        }
        return state;
    }

    updateScore(team, increment) {
        this.totalScores[team] += increment;
        if (this.period in this.periodScores) {
            this.periodScores[this.period][team] += increment;
        }
    }

    getPeriodSeconds() {
        let periodStart = 0;
        if (this.period === '2H') {
            periodStart = this.periodDurations['1H'];
        } else if (this.period === 'ET1') {
            periodStart = this.periodDurations['1H'] + this.periodDurations['2H'];
        } else if (this.period === 'ET2') {
            periodStart = this.periodDurations['1H'] + this.periodDurations['2H'] + this.periodDurations['ET1'];
        }
        return this.seconds - periodStart;
    }

    updatePeriod() {
        const prevPeriod = this.period;
        const totalTime = this.seconds;
        const h1 = this.periodDurations['1H'];
        const h2 = h1 + this.periodDurations['2H'];
        const et1 = h2 + this.periodDurations['ET1'];

        if (totalTime < h1) {
            this.period = '1H';
        } else if (totalTime < h2) {
            this.period = '2H';
        } else if (totalTime < et1) {
            this.period = 'ET1';
        } else {
            this.period = 'ET2';
        }

        return prevPeriod !== this.period;
    }

    startTimeout(team) {
        if (this.timeouts[team] <= 0 || this.isTimeoutActive) {
            return false;
        }

        this.isTimeoutActive = true;
        this.timeoutTeam = team;
        this.timeouts[team]--;
        this.timeoutStartTime = this.seconds;
        this.timeoutEndTime = this.seconds + gameConfig.timeoutDuration;
        return true;
    }

    endTimeout() {
        if (!this.isTimeoutActive) return false;
        
        this.isTimeoutActive = false;
        this.timeoutTeam = null;
        this.timeoutStartTime = 0;
        this.timeoutEndTime = 0;
        return true;
    }

    checkTimeoutStatus() {
        if (this.isTimeoutActive && this.seconds >= this.timeoutEndTime) {
            return this.endTimeout();
        }
        return false;
    }

    getTimeoutRemaining() {
        if (!this.isTimeoutActive) return 0;
        return Math.max(0, this.timeoutEndTime - this.seconds);
    }

    reset() {
        this.seconds = 0;
        this.period = '1H';
        this.periodScores = {
            '1H': { A: 0, B: 0 },
            '2H': { A: 0, B: 0 },
            'ET1': { A: 0, B: 0 },
            'ET2': { A: 0, B: 0 }
        };
        this.totalScores = { A: 0, B: 0 };
        
        // Reset all player suspensions
        for (const team of ['A', 'B']) {
            for (const player of this.players[team]) {
                player.isSuspended = false;
            }
        }
    }
} 