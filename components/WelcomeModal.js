export class WelcomeModal {
    constructor(game) {
        this.game = game;
        this.modal = document.getElementById('welcome-modal');
        this.content = this.modal?.querySelector('.modal-content');
        this.isNewPlayer = true;

        this.tips = [
            'Use route demand and risk together. High fares are not always the best long-term choice.',
            'Keep at least one vehicle idle as backup once your fleet expands.',
            'Custom routes are the fastest way to create a stronger profit edge.',
            'Daily contracts refresh your goals and keep rewards flowing.',
            'Repairing early is cheaper than losing a whole shift to a breakdown.'
        ];

        if (this.modal) {
            this.modal.addEventListener('click', (event) => {
                if (event.target === this.modal) {
                    this.hide();
                    return;
                }

                const actionButton = event.target.closest('button[data-action]');
                if (actionButton?.dataset.action === 'close-welcome') {
                    this.hide();
                }
            });
        }
    }

    show(isNewPlayer = true) {
        if (!this.modal || !this.content) return;
        this.isNewPlayer = isNewPlayer;
        this.renderContent();
        this.modal.classList.remove('hidden');
    }

    hide() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    renderContent() {
        const player = this.game.managers.economy.getPlayerState();
        const vehicles = this.game.managers.vehicle.getVehicles();
        const runningVehicles = vehicles.filter(vehicle => vehicle.status === 'running').length;
        const featuredTip = this.tips[Math.floor(Math.random() * this.tips.length)];

        this.content.innerHTML = `
            <div class="welcome-shell">
                <button class="route-close-btn welcome-close" data-action="close-welcome">×</button>
                <div class="welcome-hero">
                    <div class="welcome-badge">🚌 Matatu Empire</div>
                    <h1>${this.isNewPlayer ? 'Build a Transport Empire' : 'Back to the Road'}</h1>
                    <p>
                        ${this.isNewPlayer
                            ? 'Scale from one matatu into a resilient citywide transport operation.'
                            : 'Your business is still active. Tighten operations, grow the fleet, and keep the contracts coming.'}
                    </p>
                </div>

                <div class="welcome-grid">
                    <section class="welcome-panel">
                        <h2>${this.isNewPlayer ? 'Start Here' : 'Current Status'}</h2>
                        ${this.isNewPlayer ? `
                            <ol class="welcome-checklist">
                                <li>Pick a route with strong demand and manageable risk.</li>
                                <li>Dispatch your first vehicle, then watch fuel and condition closely.</li>
                                <li>Use early profits to unlock more vehicles and custom routes.</li>
                                <li>Complete Ops & Rewards contracts for cash, reputation, and XP.</li>
                            </ol>
                        ` : `
                            <div class="welcome-stats-grid">
                                <div class="welcome-stat-card">
                                    <span>Cash</span>
                                    <strong>Ksh ${player.cash.toLocaleString()}</strong>
                                </div>
                                <div class="welcome-stat-card">
                                    <span>Fleet</span>
                                    <strong>${vehicles.length} vehicles</strong>
                                </div>
                                <div class="welcome-stat-card">
                                    <span>Active</span>
                                    <strong>${runningVehicles} running</strong>
                                </div>
                                <div class="welcome-stat-card">
                                    <span>Level</span>
                                    <strong>Lv ${player.level || 1}</strong>
                                </div>
                            </div>
                        `}
                    </section>

                    <section class="welcome-panel">
                        <h2>Operational Tip</h2>
                        <p class="welcome-tip">${featuredTip}</p>
                        <div class="welcome-brand-card">
                            <span class="summary-label">Built by</span>
                            <strong>Cruze Intelligent Systems (U) LTD</strong>
                            <a href="https://cruzeintelligentsystems.com" target="_blank" rel="noopener noreferrer">
                                cruzeintelligentsystems.com
                            </a>
                        </div>
                    </section>
                </div>

                <div class="welcome-actions">
                    <button class="save-btn" data-action="close-welcome">
                        ${this.isNewPlayer ? 'Start Running Routes' : 'Continue Managing Empire'}
                    </button>
                </div>
            </div>
        `;
    }
}
