import { gameConfig } from '../config.js';

export class StatisticsService {
    constructor(gameState) {
        this.gameState = gameState;
        this.undoStack = [];
        this.redoStack = [];
    }

    addPlayer(team, name, number) {
        if (!name || !number) return false;

        const emptySlot = this.gameState.players[team].find(p => p.isEmpty);
        if (!emptySlot) return false;

        this.pushToUndoStack({
            type: 'ADD_PLAYER',
            team,
            playerId: emptySlot.id,
            oldData: { ...emptySlot }
        });

        emptySlot.name = name;
        emptySlot.number = number;
        emptySlot.isEmpty = false;

        return true;
    }

    updatePlayerStat(team, playerId, stat, value) {
        const player = this.gameState.players[team].find(p => p.id === playerId);
        if (!player) return false;

        this.pushToUndoStack({
            type: 'UPDATE_STAT',
            team,
            playerId,
            stat,
            oldValue: player[stat]
        });

        const success = player.updateStat(stat, value);
        
        if (success && stat === 'goals') {
            this.gameState.updateScore(team, value - player[stat]);
        }

        if (success && stat === 'twoMinutes' && value > player[stat]) {
            player.setSuspension(true, this.gameState.seconds + gameConfig.suspensionDuration);
        }

        if (success && stat === 'redCard' && value) {
            player.setSuspension(false, 0);
        }

        return success;
    }

    startTimeout(team) {
        if (this.gameState.startTimeout(team)) {
            this.pushToUndoStack({
                type: 'START_TIMEOUT',
                team,
                oldTimeouts: this.gameState.timeouts[team] + 1
            });
            return true;
        }
        return false;
    }

    endTimeout() {
        if (this.gameState.endTimeout()) {
            this.pushToUndoStack({
                type: 'END_TIMEOUT',
                team: this.gameState.timeoutTeam,
                oldTimeoutState: {
                    isActive: true,
                    team: this.gameState.timeoutTeam,
                    startTime: this.gameState.timeoutStartTime,
                    endTime: this.gameState.timeoutEndTime
                }
            });
            return true;
        }
        return false;
    }

    pushToUndoStack(action) {
        this.undoStack.push(action);
        this.redoStack = []; // Clear redo stack when new action is performed
    }

    undo() {
        const action = this.undoStack.pop();
        if (!action) return false;

        this.redoStack.push(action);

        switch (action.type) {
            case 'ADD_PLAYER':
                const player = this.gameState.players[action.team].find(p => p.id === action.playerId);
                Object.assign(player, action.oldData);
                break;

            case 'UPDATE_STAT':
                const targetPlayer = this.gameState.players[action.team].find(p => p.id === action.playerId);
                if (action.stat === 'goals') {
                    this.gameState.updateScore(action.team, action.oldValue - targetPlayer[action.stat]);
                }
                targetPlayer[action.stat] = action.oldValue;
                break;

            case 'START_TIMEOUT':
                this.gameState.timeouts[action.team] = action.oldTimeouts;
                this.gameState.endTimeout();
                break;

            case 'END_TIMEOUT':
                Object.assign(this.gameState, action.oldTimeoutState);
                break;
        }

        return true;
    }

    redo() {
        const action = this.redoStack.pop();
        if (!action) return false;

        this.undoStack.push(action);

        switch (action.type) {
            case 'ADD_PLAYER':
                const player = this.gameState.players[action.team].find(p => p.id === action.playerId);
                player.isEmpty = false;
                player.name = action.newData.name;
                player.number = action.newData.number;
                break;

            case 'UPDATE_STAT':
                const targetPlayer = this.gameState.players[action.team].find(p => p.id === action.playerId);
                if (action.stat === 'goals') {
                    this.gameState.updateScore(action.team, action.newValue - targetPlayer[action.stat]);
                }
                targetPlayer[action.stat] = action.newValue;
                break;

            case 'START_TIMEOUT':
                this.gameState.startTimeout(action.team);
                break;

            case 'END_TIMEOUT':
                this.gameState.endTimeout();
                break;
        }

        return true;
    }

    getTeamStats(team) {
        const players = this.gameState.players[team];
        return {
            totalGoals: players.reduce((sum, p) => sum + p.goals, 0),
            totalAssists: players.reduce((sum, p) => sum + p.assists, 0),
            totalSaves: players.reduce((sum, p) => sum + p.saves, 0),
            totalSteals: players.reduce((sum, p) => sum + p.steals, 0),
            totalBlocks: players.reduce((sum, p) => sum + p.blocks, 0),
            totalTurnovers: players.reduce((sum, p) => sum + p.turnovers, 0),
            yellowCards: players.reduce((sum, p) => sum + p.yellowCards, 0),
            redCards: players.filter(p => p.redCard).length,
            suspensions: players.reduce((sum, p) => sum + p.twoMinutes, 0),
            activePlayers: players.filter(p => !p.isEmpty).length,
            timeoutsLeft: this.gameState.timeouts[team]
        };
    }
} 