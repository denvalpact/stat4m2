export class TableRenderer {
    constructor(gameState, onCellClick) {
        this.gameState = gameState;
        this.onCellClick = onCellClick;
    }

    renderTeamTable(team) {
        const tbody = document.getElementById(`stats-body-${team.toLowerCase()}`);
        tbody.innerHTML = '';
        
        this.gameState.players[team].forEach((player) => {
            const tr = document.createElement('tr');
            if (player.redCard) {
                tr.classList.add('red-card');
            }
            
            if (player.isEmpty) {
                tr.classList.add('empty-player');
                tr.innerHTML = `
                    <td>${player.id}</td>
                    <td colspan="11">Empty slot - add player</td>
                `;
            } else {
                const suspensionTimer = player.isSuspended ? 
                    `<div class="suspension-timer">(${this.formatTime(player.suspensionEndTime - this.gameState.seconds)})</div>` : '';
                
                tr.innerHTML = `
                    <td>${player.id}</td>
                    <td>${player.name}</td>
                    <td>${player.number}</td>
                    <td class="stat-cell" data-stat="goals" data-player-id="${player.id}" data-team="${team}">${player.goals}</td>
                    <td class="stat-cell" data-stat="assists" data-player-id="${player.id}" data-team="${team}">${player.assists}</td>
                    <td class="stat-cell" data-stat="saves" data-player-id="${player.id}" data-team="${team}">${player.saves}</td>
                    <td class="stat-cell" data-stat="twoMinutes" data-player-id="${player.id}" data-team="${team}">${player.twoMinutes}${suspensionTimer}</td>
                    <td class="stat-cell" data-stat="yellowCards" data-player-id="${player.id}" data-team="${team}" ${player.yellowCards > 0 ? 'class="yellow-card"' : ''}>${player.yellowCards}</td>
                    <td class="stat-cell" data-stat="redCard" data-player-id="${player.id}" data-team="${team}">${player.redCard ? 'X' : ''}</td>
                    <td class="stat-cell" data-stat="steals" data-player-id="${player.id}" data-team="${team}">${player.steals}</td>
                    <td class="stat-cell" data-stat="blocks" data-player-id="${player.id}" data-team="${team}">${player.blocks}</td>
                    <td class="stat-cell" data-stat="turnovers" data-player-id="${player.id}" data-team="${team}">${player.turnovers}</td>
                `;
            }
            tbody.appendChild(tr);
        });

        this.setupCellClickHandlers(team);
    }

    setupCellClickHandlers(team) {
        const tbody = document.getElementById(`stats-body-${team.toLowerCase()}`);
        tbody.querySelectorAll('.stat-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                if (e.button === 0) { // Left click only
                    const data = {
                        team: cell.getAttribute('data-team'),
                        playerId: parseInt(cell.getAttribute('data-player-id')),
                        stat: cell.getAttribute('data-stat'),
                        element: cell
                    };
                    this.onCellClick(data, 1);
                }
            });

            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const data = {
                    team: cell.getAttribute('data-team'),
                    playerId: parseInt(cell.getAttribute('data-player-id')),
                    stat: cell.getAttribute('data-stat'),
                    element: cell
                };
                this.onCellClick(data, -1);
            });
        });
    }

    updateTimeoutDisplay(team) {
        document.getElementById(`timeout-count-${team.toLowerCase()}`).textContent = 
            this.gameState.timeouts[team];
        
        const button = document.getElementById(`timeout-button-${team.toLowerCase()}`);
        button.classList.toggle('timeout-disabled', this.gameState.timeouts[team] <= 0);
        button.classList.toggle('timeout-active', 
            this.gameState.isTimeoutActive && this.gameState.timeoutTeam === team);
    }

    updateTimeoutTimer() {
        if (!this.gameState.isTimeoutActive) {
            document.getElementById(`timeout-timer-${this.gameState.timeoutTeam?.toLowerCase()}`).textContent = '';
            return;
        }

        const remainingSeconds = this.gameState.getTimeoutRemaining();
        const timerText = this.formatTime(remainingSeconds);
        document.getElementById(`timeout-timer-${this.gameState.timeoutTeam.toLowerCase()}`).textContent = timerText;
    }

    updatePeriodDisplay() {
        document.querySelectorAll('.time-markers div').forEach(el => {
            el.classList.remove('active-period');
        });
        document.getElementById(`period-${this.gameState.period}`).classList.add('active-period');
        document.getElementById('current-period').textContent = this.gameState.period;
    }

    updateScoreDisplay() {
        for (const period in this.gameState.periodScores) {
            const scoreElement = document.getElementById(`period-${period.toLowerCase()}-score`);
            if (scoreElement) {
                const scores = this.gameState.periodScores[period];
                scoreElement.textContent = `${scores.A} / ${scores.B}`;
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
} 