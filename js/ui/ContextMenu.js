export class ContextMenu {
    constructor(statisticsService) {
        this.statisticsService = statisticsService;
        this.element = document.getElementById('context-menu');
        this.currentCell = null;
        this.currentData = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (e.target.className !== 'stat-cell' && !this.element.contains(e.target)) {
                this.hide();
            }
        });

        // Prevent default context menu
        document.addEventListener('contextmenu', (e) => {
            if (e.target.className === 'stat-cell') {
                e.preventDefault();
            }
        });

        // Setup button handlers
        document.getElementById('increment-btn').addEventListener('click', () => this.handleIncrement());
        document.getElementById('decrement-btn').addEventListener('click', () => this.handleDecrement());
        document.getElementById('reset-btn').addEventListener('click', () => this.handleReset());

        // Touch device support
        document.addEventListener('touchstart', (e) => {
            if (e.target.className === 'stat-cell') {
                const pressTimer = setTimeout(() => {
                    this.show(e.target, e);
                }, 500);

                e.target.addEventListener('touchend', () => {
                    clearTimeout(pressTimer);
                }, { once: true });

                e.target.addEventListener('touchmove', () => {
                    clearTimeout(pressTimer);
                }, { once: true });
            }
        });
    }

    show(cell, event) {
        this.currentCell = cell;
        this.currentData = {
            team: cell.getAttribute('data-team'),
            playerId: parseInt(cell.getAttribute('data-player-id')),
            stat: cell.getAttribute('data-stat')
        };

        this.element.style.display = 'block';
        
        // Position the menu
        const rect = cell.getBoundingClientRect();
        const menuRect = this.element.getBoundingClientRect();
        
        let x = event.clientX || event.touches[0].clientX;
        let y = event.clientY || event.touches[0].clientY;
        
        // Adjust position if menu would go off screen
        if (x + menuRect.width > window.innerWidth) {
            x = window.innerWidth - menuRect.width;
        }
        if (y + menuRect.height > window.innerHeight) {
            y = window.innerHeight - menuRect.height;
        }
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    hide() {
        this.element.style.display = 'none';
        this.currentCell = null;
        this.currentData = null;
    }

    handleIncrement() {
        if (this.currentData) {
            this.statisticsService.updatePlayerStat(
                this.currentData.team,
                this.currentData.playerId,
                this.currentData.stat,
                parseInt(this.currentCell.textContent || '0') + 1
            );
        }
        this.hide();
    }

    handleDecrement() {
        if (this.currentData) {
            this.statisticsService.updatePlayerStat(
                this.currentData.team,
                this.currentData.playerId,
                this.currentData.stat,
                Math.max(0, parseInt(this.currentCell.textContent || '0') - 1)
            );
        }
        this.hide();
    }

    handleReset() {
        if (this.currentData) {
            this.statisticsService.updatePlayerStat(
                this.currentData.team,
                this.currentData.playerId,
                this.currentData.stat,
                0
            );
        }
        this.hide();
    }
} 