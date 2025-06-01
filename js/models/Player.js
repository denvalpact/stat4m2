export class Player {
    constructor(id) {
        this.id = id;
        this.name = "";
        this.number = "";
        this.goals = 0;
        this.assists = 0;
        this.saves = 0;
        this.twoMinutes = 0;
        this.yellowCards = 0;
        this.redCard = false;
        this.steals = 0;
        this.blocks = 0;
        this.turnovers = 0;
        this.isEmpty = true;
        this.suspensionEndTime = 0;
        this.isSuspended = false;
    }

    static fromData(data) {
        const player = new Player(data.id);
        Object.assign(player, data);
        return player;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            number: this.number,
            goals: this.goals,
            assists: this.assists,
            saves: this.saves,
            twoMinutes: this.twoMinutes,
            yellowCards: this.yellowCards,
            redCard: this.redCard,
            steals: this.steals,
            blocks: this.blocks,
            turnovers: this.turnovers,
            isEmpty: this.isEmpty,
            suspensionEndTime: this.suspensionEndTime,
            isSuspended: this.isSuspended
        };
    }

    updateStat(stat, value) {
        if (this.redCard || this.isEmpty) return false;

        switch (stat) {
            case 'twoMinutes':
                if (value >= 0 && value <= 3) {
                    this.twoMinutes = value;
                    return true;
                }
                break;
            case 'yellowCards':
                if (value >= 0 && value <= 2) {
                    this.yellowCards = value;
                    return true;
                }
                break;
            case 'redCard':
                this.redCard = value > 0;
                this.isSuspended = false;
                return true;
            default:
                if (value >= 0) {
                    this[stat] = value;
                    return true;
                }
                break;
        }
        return false;
    }

    setSuspension(isActive, endTime = 0) {
        this.isSuspended = isActive;
        this.suspensionEndTime = endTime;
    }

    checkSuspensionStatus(currentTime) {
        if (this.isSuspended && currentTime >= this.suspensionEndTime) {
            this.isSuspended = false;
            return true;
        }
        return false;
    }
} 