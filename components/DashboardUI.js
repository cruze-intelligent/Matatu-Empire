export class DashboardUI {
    constructor(game) {
        this.game = game;
        this.dashboardContainer = document.getElementById('dashboard-container');
        this.routeMarketContainer = document.getElementById('route-market-container');
        this.progressionContainer = document.getElementById('progression-container');
        this.fleetContainer = document.getElementById('fleet-container');
        this.fleetList = document.getElementById('fleet-list');
        this.buyVehicleModal = document.getElementById('buy-vehicle-modal');
        this.buyVehicleList = document.getElementById('buy-vehicle-list');
        this.routeDetailsContainer = document.getElementById('route-details-container');
        this.liveProgressionRenderAt = 0;
        this.progressionRenderSignature = '';

        if (!this.dashboardContainer || !this.fleetContainer || !this.fleetList) {
            console.error('Required dashboard elements not found');
            return;
        }

        this.initializeEventListeners();
        console.log('✅ DashboardUI initialized');
    }

    initializeEventListeners() {
        this.setupBuyVehicleButton();
        this.setupBuyVehicleModal();
        this.setupFleetActions();
        this.setupRouteDetailsEventHandling();
        this.setupProgressionActions();
        this.setupRouteMarketActions();
        this.setupGameControls();
    }

    setupBuyVehicleButton() {
        const buyBtn = document.getElementById('buy-matatu-btn');
        if (!buyBtn) return;

        buyBtn.addEventListener('click', (event) => {
            event.preventDefault();
            this.showBuyVehicleModal();
        });
    }

    setupBuyVehicleModal() {
        if (!this.buyVehicleModal || !this.buyVehicleList) return;

        const closeBtn = this.buyVehicleModal.querySelector('#close-buy-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideBuyVehicleModal());
        }

        this.buyVehicleModal.addEventListener('click', (event) => {
            if (event.target === this.buyVehicleModal) {
                this.hideBuyVehicleModal();
                return;
            }

            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            if (actionButton.dataset.action === 'purchase-vehicle') {
                this.purchaseVehicle(actionButton.dataset.typeId);
            }
        });
    }

    setupFleetActions() {
        this.fleetList.addEventListener('click', (event) => {
            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            const vehicleId = parseInt(actionButton.dataset.vehicleId, 10);
            const routeId = actionButton.dataset.routeId;

            switch (actionButton.dataset.action) {
                case 'assign-route':
                    this.showRouteSelector(vehicleId);
                    break;
                case 'stop-route':
                    this.game.unassignVehicleFromRoute(vehicleId, routeId);
                    break;
                case 'repair-vehicle':
                    this.repairVehicle(vehicleId);
                    break;
                case 'refuel-vehicle':
                    this.refuelVehicle(vehicleId);
                    break;
                case 'edit-nickname':
                    this.editVehicleNickname(vehicleId);
                    break;
                case 'manage-driver':
                    this.manageDriver(vehicleId);
                    break;
                case 'sell-vehicle':
                    this.sellVehicle(vehicleId);
                    break;
                default:
                    break;
            }
        });
    }

    setupRouteDetailsEventHandling() {
        if (!this.routeDetailsContainer) return;

        this.routeDetailsContainer.addEventListener('click', (event) => {
            if (event.target === this.routeDetailsContainer) {
                this.routeDetailsContainer.classList.add('hidden');
                return;
            }

            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            const vehicleId = parseInt(actionButton.dataset.vehicleId, 10);
            const routeId = actionButton.dataset.routeId;

            switch (actionButton.dataset.action) {
                case 'close-route-details':
                    this.routeDetailsContainer.classList.add('hidden');
                    break;
                case 'assign-from-route':
                    this.game.assignVehicleToRoute(vehicleId, routeId);
                    this.routeDetailsContainer.classList.add('hidden');
                    break;
                case 'unassign-from-route':
                    this.game.unassignVehicleFromRoute(vehicleId, routeId);
                    this.routeDetailsContainer.classList.add('hidden');
                    break;
                default:
                    break;
            }
        });
    }

    setupProgressionActions() {
        if (!this.progressionContainer) return;

        this.progressionContainer.addEventListener('click', (event) => {
            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            if (actionButton.dataset.action === 'discard-contract') {
                const discarded = this.game.progressionManager?.discardContract(actionButton.dataset.contractId);
                if (discarded) {
                    this.update();
                }
            }
        });
    }

    setupRouteMarketActions() {
        if (!this.routeMarketContainer) return;

        this.routeMarketContainer.addEventListener('click', (event) => {
            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            if (actionButton.dataset.action === 'inspect-route') {
                const route = this.game.routeManager.getRouteById(actionButton.dataset.routeId);
                if (route) {
                    this.showRouteDetails(route);
                }
            }
        });
    }

    setupGameControls() {
        const saveBtn = document.getElementById('save-game');
        const resetBtn = document.getElementById('reset-game');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.game.saveGame());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.game.resetGame());
        }
    }

    showBuyVehicleModal() {
        if (!this.buyVehicleModal || !this.buyVehicleList) return;

        const vehicleTypes = this.game.vehicleManager.getVehicleTypes();
        const playerCash = this.game.economy.getPlayerState().cash;
        this.renderVehicleTypes(vehicleTypes, playerCash);

        this.buyVehicleModal.classList.remove('hidden');
        this.buyVehicleModal.style.display = 'flex';
    }

    hideBuyVehicleModal() {
        if (!this.buyVehicleModal) return;
        this.buyVehicleModal.classList.add('hidden');
        this.buyVehicleModal.style.display = 'none';
    }

    renderVehicleTypes(vehicleTypes, playerCash) {
        if (!vehicleTypes || vehicleTypes.length === 0) {
            this.buyVehicleList.innerHTML = '<p class="no-vehicles">No vehicles available for purchase right now.</p>';
            return;
        }

        this.buyVehicleList.innerHTML = `
            <div class="buy-vehicle-summary">
                <div class="buy-vehicle-summary-card glass-chip">
                    <span class="summary-label">Available Cash</span>
                    <strong>Ksh ${playerCash.toLocaleString()}</strong>
                </div>
                <div class="buy-vehicle-summary-card glass-chip">
                    <span class="summary-label">Empire Level</span>
                    <strong>Lv ${this.game.economy.getPlayerState().level || 1}</strong>
                </div>
            </div>
            ${vehicleTypes.map(vehicleType => {
                const canAfford = playerCash >= vehicleType.cost;
                const estimatedYield = this.estimateVehicleStandaloneYield(vehicleType);

                return `
                    <article class="vehicle-type-card glass-card ${canAfford ? 'affordable' : 'unaffordable'}">
                        <div class="vehicle-type-header">
                            <div>
                                <h3 class="vehicle-type-name">${vehicleType.name}</h3>
                                <p class="vehicle-type-copy">${vehicleType.description}</p>
                            </div>
                            <div class="vehicle-type-price">
                                <span class="currency">Ksh</span>
                                <span class="amount">${vehicleType.cost.toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="vehicle-type-stats compact-stats">
                            <div class="stat-row"><span class="stat-label">Capacity</span><span class="stat-value">${vehicleType.capacity}</span></div>
                            <div class="stat-row"><span class="stat-label">Speed</span><span class="stat-value">${vehicleType.speed || 5}/10</span></div>
                            <div class="stat-row"><span class="stat-label">Reliability</span><span class="stat-value">${vehicleType.reliability}/10</span></div>
                            <div class="stat-row"><span class="stat-label">Efficiency</span><span class="stat-value">${vehicleType.fuelEfficiency || vehicleType.reliability || 5}/10</span></div>
                            <div class="stat-row"><span class="stat-label">Range</span><span class="stat-value">${vehicleType.maxDistance || 100} km</span></div>
                            <div class="stat-row"><span class="stat-label">Projected Yield</span><span class="stat-value">Ksh ${estimatedYield.toLocaleString()}/hr</span></div>
                        </div>
                        <button
                            class="buy-vehicle-btn ${canAfford ? 'enabled' : 'disabled'}"
                            data-action="purchase-vehicle"
                            data-type-id="${vehicleType.id}"
                            ${canAfford ? '' : 'disabled'}
                        >
                            ${canAfford ? `Buy ${vehicleType.name}` : 'Insufficient Funds'}
                        </button>
                    </article>
                `;
            }).join('')}
        `;
    }

    purchaseVehicle(typeId) {
        const vehicleType = this.game.vehicleManager.getVehicleType(typeId);
        if (!vehicleType) {
            this.showToast('Vehicle type not found.', 'error');
            return;
        }

        if (!this.game.economy.spendCash(vehicleType.cost)) {
            this.showToast('Insufficient funds for that purchase.', 'error');
            return;
        }

        const newVehicle = this.game.vehicleManager.buyVehicle(typeId);
        if (!newVehicle) {
            this.game.economy.addCash(vehicleType.cost);
            this.showToast('Failed to add the vehicle to your fleet.', 'error');
            return;
        }

        this.game.progressionManager?.recordVehiclePurchase(vehicleType.cost);
        this.game.progressionManager?.evaluateProgress();

        this.hideBuyVehicleModal();
        this.update();
        this.showToast(`${vehicleType.name} added to your fleet. Hire a driver before dispatch.`, 'success');
    }

    refreshLiveData() {
        if (!this.game || !this.game.isInitialized) return;

        this.updateStats();
        this.syncVehicleCards();

        if (Date.now() - this.liveProgressionRenderAt > 4000) {
            this.refreshProgressionLiveData();
            this.liveProgressionRenderAt = Date.now();
        }
    }

    update() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            this.game.progressionManager?.evaluateProgress();
            this.updateStats();
            this.renderRouteMarketPanel();
            this.renderProgressionPanel();
            this.syncVehicleCards(true);

            if (this.routeDetailsContainer && !this.routeDetailsContainer.classList.contains('hidden')) {
                const routeId = this.routeDetailsContainer.dataset.currentRouteId;
                const route = routeId ? this.game.routeManager.getRouteById(routeId) : null;
                if (route) {
                    this.showRouteDetails(route);
                } else {
                    this.routeDetailsContainer.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateStats() {
        const player = this.game.economy.getPlayerState();
        const vehicles = this.game.vehicleManager.getVehicles();
        const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'running').length;

        this.setText('cash-display', `Ksh ${player.cash.toLocaleString()}`);
        this.setText('reputation-display', `${player.reputation}/100`);
        this.setText('daily-profit', `Ksh ${player.dailyProfit.toLocaleString()}`);
        this.setText('total-earnings', `Ksh ${player.totalEarningsAllTime.toLocaleString()}`);
        this.setText('active-vehicles', `${activeVehicles}/${vehicles.length}`);
    }

    renderRouteMarketPanel() {
        if (!this.routeMarketContainer) return;

        const routes = this.getRouteMarketData();
        this.routeMarketContainer.innerHTML = `
            <h2>🗺️ Route Market</h2>
            <div class="route-market-grid">
                ${routes.map(entry => `
                    <article class="route-market-card glass-card">
                        <div class="route-market-header">
                            <div>
                                <h3>${entry.route.name}</h3>
                                <p>${entry.demandLabel} demand • ${this.getRiskLabel(entry.route.risk)}</p>
                            </div>
                            <span class="route-rank">#${entry.rank}</span>
                        </div>
                        <div class="route-market-metrics">
                            <div><span>Demand</span><strong>${entry.route.passengerFlow}/10</strong></div>
                            <div><span>Fare</span><strong>Ksh ${entry.route.fare}</strong></div>
                            <div><span>Trip Cost</span><strong>Ksh ${entry.tripCost.toLocaleString()}</strong></div>
                            <div><span>Projected Margin</span><strong>Ksh ${entry.margin.toLocaleString()}</strong></div>
                        </div>
                        <button class="inspect-route-btn" data-action="inspect-route" data-route-id="${entry.route.id}">
                            Inspect Route
                        </button>
                    </article>
                `).join('')}
            </div>
        `;
    }

    renderProgressionPanel() {
        if (!this.progressionContainer || !this.game.progressionManager) return;

        const data = this.game.progressionManager.getDashboardData();
        const xpPercent = data.xpForLevel > 0 ? Math.round((data.xpIntoLevel / data.xpForLevel) * 100) : 0;
        const renderSignature = this.getProgressionRenderSignature(data);

        this.progressionContainer.innerHTML = `
            <h2>🏁 Ops & Rewards</h2>
            <div class="ops-shell">
                <section class="ops-hero glass-card">
                    <div class="ops-level-panel">
                        <span class="summary-label">Empire Level</span>
                        <strong data-progress-field="level">Lv ${data.level}</strong>
                        <p data-progress-field="xp-copy">${data.xpIntoLevel}/${data.xpForLevel} XP to next level</p>
                        <div class="progress-bar large"><span data-progress-field="xp-bar" style="width: ${xpPercent}%"></span></div>
                    </div>
                    <div class="ops-status-grid">
                        <article class="ops-status-card glass-chip">
                            <span class="summary-label">Contracts Cleared</span>
                            <strong data-progress-field="contract-count">${data.contractsCompleted}/${data.contractsTotal}</strong>
                            <small>Drop weak offers and keep stronger work on the board.</small>
                        </article>
                        <article class="ops-status-card glass-chip">
                            <span class="summary-label">Milestones</span>
                            <strong data-progress-field="milestone-count">${data.milestonesCompleted}/${data.milestonesTotal}</strong>
                            <small>Long-term empire growth now reads clearly in one place.</small>
                        </article>
                        <article class="ops-status-card glass-chip">
                            <span class="summary-label">Tracked Spend</span>
                            <strong data-progress-field="operating-spend">Ksh ${data.operatingSpend.toLocaleString()}</strong>
                            <small>Fuel and repairs now feed progression visibility.</small>
                        </article>
                    </div>
                </section>

                <div class="ops-columns">
                    <section class="contract-board glass-card">
                        <div class="ops-panel-header">
                            <div>
                                <h3>Operations Contracts</h3>
                                <p>Track purchases, route hours, crew growth and dispatch discipline.</p>
                            </div>
                            <span class="ops-count">${data.contracts.filter(contract => contract.claimed).length}/${data.contracts.length} complete</span>
                        </div>
                        <div class="contract-stack">
                            ${data.contracts.length > 0 ? data.contracts.map(contract => `
                                <article class="contract-card glass-chip ${contract.claimed ? 'completed' : ''}" data-contract-id="${contract.id}">
                                    <div class="contract-header">
                                        <div class="contract-copy">
                                            <span class="summary-label">Contract</span>
                                            <h4>${contract.title}</h4>
                                            <p>${contract.description}</p>
                                        </div>
                                        <div class="contract-meta">
                                            <span data-contract-progress>${contract.claimed ? 'Complete' : `${this.formatContractProgress(contract.progress)}/${this.formatContractProgress(contract.target)}`}</span>
                                            ${!contract.claimed ? `
                                                <button type="button" class="contract-delete-btn" data-action="discard-contract" data-contract-id="${contract.id}">
                                                    Replace
                                                </button>
                                            ` : '<span class="contract-badge">Reward paid</span>'}
                                        </div>
                                    </div>
                                    <div class="progress-bar compact"><span data-contract-bar style="width: ${contract.completion}%"></span></div>
                                    <small class="contract-reward-copy">${this.game.progressionManager.formatRewardSummary(contract.rewards)}</small>
                                </article>
                            `).join('') : '<p class="no-vehicles">New contracts will appear as your empire grows.</p>'}
                        </div>
                    </section>

                    <aside class="progress-board glass-card">
                        <div class="ops-panel-header">
                            <div>
                                <h3>Progress Tracking</h3>
                                <p>Purchases, time on route, dispatches, crew growth and operating costs all feed progression now.</p>
                            </div>
                        </div>
                        ${data.nextMilestone ? `
                            <article class="progress-focus-card glass-chip">
                                <span class="summary-label">Next Milestone</span>
                                <h4 data-milestone-title>${data.nextMilestone.title}</h4>
                                <p data-milestone-copy>${data.nextMilestone.description}</p>
                                <div class="milestone-progress">
                                    <span data-milestone-count>${this.formatContractProgress(data.nextMilestone.progress)}/${this.formatContractProgress(data.nextMilestone.target)}</span>
                                </div>
                                <div class="progress-bar compact"><span data-milestone-bar style="width: ${data.nextMilestone.completion}%"></span></div>
                                <small>${this.game.progressionManager.formatRewardSummary(data.nextMilestone.rewards)}</small>
                            </article>
                        ` : `
                            <article class="progress-focus-card glass-chip progress-focus-empty">
                                <span class="summary-label">Next Milestone</span>
                                <h4>Milestones cleared</h4>
                                <p>Current long-form rewards are complete. New depth will keep coming from contracts and fleet growth.</p>
                            </article>
                        `}
                        <div class="progress-tracker-grid">
                            ${data.trackers.map(tracker => `
                                <article class="progress-tracker-card glass-chip" data-tracker-id="${tracker.id}">
                                    <span class="summary-label">${tracker.label}</span>
                                    <strong data-tracker-value>${tracker.value}</strong>
                                    <small>${tracker.helper}</small>
                                </article>
                            `).join('')}
                        </div>
                        <p class="progress-footnote">Progress is retained from purchases, route time, dispatches, drivers, fuel spend, repairs and contract cycling.</p>
                    </aside>
                </div>
            </div>
        `;

        this.progressionRenderSignature = renderSignature;
        this.liveProgressionRenderAt = Date.now();
    }

    refreshProgressionLiveData() {
        if (!this.progressionContainer || !this.progressionContainer.children.length) return;

        const data = this.game.progressionManager.getDashboardData();
        const xpPercent = data.xpForLevel > 0 ? Math.round((data.xpIntoLevel / data.xpForLevel) * 100) : 0;
        const renderSignature = this.getProgressionRenderSignature(data);

        if (renderSignature !== this.progressionRenderSignature) {
            this.renderProgressionPanel();
            return;
        }

        this.setContainerText(this.progressionContainer, '[data-progress-field="level"]', `Lv ${data.level}`);
        this.setContainerText(this.progressionContainer, '[data-progress-field="xp-copy"]', `${data.xpIntoLevel}/${data.xpForLevel} XP to next level`);
        this.setContainerStyle(this.progressionContainer, '[data-progress-field="xp-bar"]', 'width', `${xpPercent}%`);
        this.setContainerText(this.progressionContainer, '[data-progress-field="contract-count"]', `${data.contractsCompleted}/${data.contractsTotal}`);
        this.setContainerText(this.progressionContainer, '[data-progress-field="milestone-count"]', `${data.milestonesCompleted}/${data.milestonesTotal}`);
        this.setContainerText(this.progressionContainer, '[data-progress-field="operating-spend"]', `Ksh ${data.operatingSpend.toLocaleString()}`);

        data.trackers.forEach(tracker => {
            const card = this.progressionContainer.querySelector(`[data-tracker-id="${tracker.id}"] [data-tracker-value]`);
            if (card) {
                card.textContent = tracker.value;
            }
        });

        data.contracts.forEach(contract => {
            const card = this.progressionContainer.querySelector(`[data-contract-id="${contract.id}"]`);
            if (!card) return;

            card.classList.toggle('completed', contract.claimed);
            const progressLabel = card.querySelector('[data-contract-progress]');
            if (progressLabel) {
                progressLabel.textContent = contract.claimed
                    ? 'Complete'
                    : `${this.formatContractProgress(contract.progress)}/${this.formatContractProgress(contract.target)}`;
            }
            const progressBar = card.querySelector('[data-contract-bar]');
            if (progressBar) {
                progressBar.style.width = `${contract.completion}%`;
            }
        });

        if (data.nextMilestone) {
            this.setContainerText(this.progressionContainer, '[data-milestone-title]', data.nextMilestone.title);
            this.setContainerText(this.progressionContainer, '[data-milestone-copy]', data.nextMilestone.description);
            this.setContainerText(
                this.progressionContainer,
                '[data-milestone-count]',
                `${this.formatContractProgress(data.nextMilestone.progress)}/${this.formatContractProgress(data.nextMilestone.target)}`
            );
            this.setContainerStyle(this.progressionContainer, '[data-milestone-bar]', 'width', `${data.nextMilestone.completion}%`);
        }
    }

    syncVehicleCards() {
        const vehicles = this.getOrderedVehicles();

        if (vehicles.length === 0) {
            if (!this.fleetList.querySelector('.empty-fleet-message')) {
                this.fleetList.innerHTML = `
                    <div class="empty-fleet-message">
                        <div class="empty-icon">🚐</div>
                        <h3>No vehicles in your fleet</h3>
                        <p>Buy a matatu to start earning and unlock the next rewards.</p>
                    </div>
                `;
            }
            return;
        }

        if (this.fleetList.querySelector('.empty-fleet-message')) {
            this.fleetList.innerHTML = '';
        }

        const existingCards = new Map(
            [...this.fleetList.querySelectorAll('.vehicle-card')]
                .map(card => [parseInt(card.dataset.vehicleId, 10), card])
        );
        const activeIds = new Set(vehicles.map(vehicle => vehicle.id));

        existingCards.forEach((card, vehicleId) => {
            if (!activeIds.has(vehicleId)) {
                card.remove();
            }
        });

        vehicles.forEach((vehicle, index) => {
            let card = this.fleetList.querySelector(`.vehicle-card[data-vehicle-id="${vehicle.id}"]`);
            if (!card) {
                card = this.createVehicleCard(vehicle);
            }

            this.patchVehicleCard(card, vehicle);

            const currentChild = this.fleetList.children[index];
            if (currentChild !== card) {
                this.fleetList.insertBefore(card, currentChild || null);
            }
        });
    }

    getOrderedVehicles() {
        const statusPriority = {
            breakdown: 0,
            out_of_fuel: 1,
            running: 2,
            idle: 3,
            maintenance: 4
        };

        return [...this.game.vehicleManager.getVehicles()].sort((left, right) => {
            const leftPriority = statusPriority[left.status] ?? 99;
            const rightPriority = statusPriority[right.status] ?? 99;
            if (leftPriority !== rightPriority) return leftPriority - rightPriority;
            return left.id - right.id;
        });
    }

    createVehicleCard(vehicle) {
        const card = document.createElement('article');
        card.className = 'vehicle-card glass-card fade-in';
        card.dataset.vehicleId = vehicle.id;
        card.innerHTML = `
            <div class="vehicle-card-header">
                <div class="vehicle-title">
                    <h4 class="vehicle-name" data-field="vehicle-name"></h4>
                    <span class="maintenance-warning" data-field="vehicle-warning"></span>
                </div>
                <span class="vehicle-status" data-field="vehicle-status"></span>
            </div>

            <div class="vehicle-driver-strip glass-chip">
                <div>
                    <span class="summary-label">Driver</span>
                    <strong data-field="driver-name"></strong>
                </div>
                <span class="driver-meta" data-field="driver-meta"></span>
            </div>

            <div class="vehicle-nickname-display">
                <span class="nickname-label">Map Call Sign</span>
                <span class="nickname-value" data-field="nickname"></span>
            </div>

            <div class="vehicle-stats">
                <div class="stat"><span class="label">⛽ Fuel</span><span class="value" data-field="fuel"></span></div>
                <div class="stat"><span class="label">🔧 Condition</span><span class="value" data-field="condition"></span></div>
                <div class="stat"><span class="label">🛣️ Route</span><span class="value" data-field="route"></span></div>
                <div class="stat"><span class="label">💰 Earnings</span><span class="value" data-field="earnings"></span></div>
                <div class="stat"><span class="label">📈 Yield</span><span class="value" data-field="yield"></span></div>
                <div class="stat"><span class="label">📏 Range</span><span class="value" data-field="range"></span></div>
            </div>

            <div class="vehicle-actions">
                <button class="assign-btn" data-field="primary-action"></button>
                <button class="repair-btn" data-action="repair-vehicle" data-vehicle-id="${vehicle.id}">Repair</button>
                <button class="refuel-btn" data-action="refuel-vehicle" data-vehicle-id="${vehicle.id}">Refuel</button>
                <button class="driver-btn" data-action="manage-driver" data-vehicle-id="${vehicle.id}">Driver</button>
                <button class="nickname-btn" data-action="edit-nickname" data-vehicle-id="${vehicle.id}">Nickname</button>
                <button class="sell-btn" data-action="sell-vehicle" data-vehicle-id="${vehicle.id}">Sell</button>
            </div>
        `;

        return card;
    }

    patchVehicleCard(card, vehicle) {
        const route = vehicle.routeId ? this.game.routeManager.getRouteById(vehicle.routeId) : null;
        const vehicleType = this.game.vehicleManager.getVehicleType(vehicle.typeId);
        const driver = vehicle.driver;
        const estimatedYield = route
            ? this.estimateVehicleRouteIncome(vehicle, route)
            : this.estimateVehicleStandaloneYield(vehicleType);
        const sellValue = vehicleType ? Math.round(vehicleType.cost * 0.6) : 1000;
        const warning = vehicle.fuel < 30 || vehicle.condition < 45 ? '⚠️' : '';

        this.setContainerText(card, '[data-field="vehicle-name"]', vehicle.name);
        this.setContainerText(card, '[data-field="vehicle-warning"]', warning);
        this.setContainerText(card, '[data-field="vehicle-status"]', vehicle.status.replace('_', ' '));
        this.setContainerStyle(card, '[data-field="vehicle-status"]', 'background', this.getStatusColor(vehicle.status));

        this.setContainerText(card, '[data-field="driver-name"]', driver?.name || 'No driver hired');
        this.setContainerText(
            card,
            '[data-field="driver-meta"]',
            driver ? `${driver.trait} • Ksh ${driver.salaryPerHour}/hr` : 'Hire required before dispatch'
        );
        this.setContainerText(card, '[data-field="nickname"]', vehicle.nickname || this.generateDefaultNickname(vehicle.name));
        this.setContainerText(card, '[data-field="fuel"]', `${Math.round(vehicle.fuel)}%`);
        this.setContainerText(card, '[data-field="condition"]', `${Math.round(vehicle.condition)}%`);
        this.setContainerText(card, '[data-field="route"]', route ? route.name : 'Idle');
        this.setContainerText(card, '[data-field="earnings"]', `Ksh ${(vehicle.totalEarnings || 0).toLocaleString()}`);
        this.setContainerText(card, '[data-field="yield"]', `Ksh ${estimatedYield.toLocaleString()}/hr`);
        this.setContainerText(card, '[data-field="range"]', `${vehicleType?.maxDistance || 100} km`);

        const fuelValue = card.querySelector('[data-field="fuel"]');
        const conditionValue = card.querySelector('[data-field="condition"]');
        fuelValue?.classList.toggle('warning', vehicle.fuel < 30);
        conditionValue?.classList.toggle('danger', vehicle.condition < 45);

        const primaryButton = card.querySelector('[data-field="primary-action"]');
        if (primaryButton) {
            if (vehicle.status === 'running') {
                primaryButton.textContent = 'Stop Route';
                primaryButton.className = 'unassign-btn';
                primaryButton.dataset.action = 'stop-route';
                primaryButton.dataset.vehicleId = String(vehicle.id);
                primaryButton.dataset.routeId = vehicle.routeId || '';
            } else {
                primaryButton.textContent = 'Assign Route';
                primaryButton.className = 'assign-btn';
                primaryButton.dataset.action = 'assign-route';
                primaryButton.dataset.vehicleId = String(vehicle.id);
                delete primaryButton.dataset.routeId;
            }
        }

        const driverButton = card.querySelector('.driver-btn');
        if (driverButton) {
            driverButton.textContent = driver ? 'Edit Driver' : 'Hire Driver';
        }

        const sellButton = card.querySelector('.sell-btn');
        if (sellButton) {
            sellButton.textContent = `Sell Ksh ${sellValue.toLocaleString()}`;
        }
    }

    showRouteDetails(route) {
        if (!route || !this.routeDetailsContainer) return;

        const vehicles = this.game.vehicleManager.getVehicles();
        const assignedVehicles = vehicles
            .filter(vehicle => vehicle.routeId === route.id)
            .sort((left, right) => this.estimateVehicleRouteIncome(right, route) - this.estimateVehicleRouteIncome(left, route));
        const availableVehicles = vehicles
            .filter(vehicle => this.canVehicleServeRoute(vehicle, route))
            .sort((left, right) => this.estimateVehicleRouteIncome(right, route) - this.estimateVehicleRouteIncome(left, route));

        const routeYield = this.estimateRouteBaseRevenue(route);
        const routeCost = this.estimateRouteBaseCost(route);

        this.routeDetailsContainer.dataset.currentRouteId = route.id;
        this.routeDetailsContainer.innerHTML = `
            <div class="route-details-content glass-card">
                <div class="route-details-header">
                    <div>
                        <h3>🛣️ ${route.name}</h3>
                        <p class="route-copy">Demand ${route.passengerFlow}/10 • Trip cost Ksh ${routeCost.toLocaleString()} • Revenue Ksh ${routeYield.toLocaleString()}</p>
                    </div>
                    <button class="route-close-btn" data-action="close-route-details">×</button>
                </div>

                <div class="route-stats">
                    <div class="stat"><span class="label">📍 From</span><span class="value">${route.start}</span></div>
                    <div class="stat"><span class="label">📍 To</span><span class="value">${route.end}</span></div>
                    <div class="stat"><span class="label">📏 Distance</span><span class="value">${route.distance} km</span></div>
                    <div class="stat"><span class="label">👥 Demand</span><span class="value">${route.passengerFlow}/10</span></div>
                    <div class="stat"><span class="label">💰 Fare</span><span class="value">Ksh ${route.fare}</span></div>
                    <div class="stat"><span class="label">⚠️ Risk</span><span class="value">${route.risk}/10</span></div>
                </div>

                <section class="assigned-vehicles">
                    <h4>Assigned Vehicles (${assignedVehicles.length})</h4>
                    ${assignedVehicles.length > 0 ? assignedVehicles.map(vehicle => `
                        <div class="vehicle-item glass-chip">
                            <div class="vehicle-info">
                                <span class="vehicle-name">${vehicle.name}</span>
                                <span class="vehicle-condition">
                                    ${vehicle.driver?.name || 'No driver'} • Yield Ksh ${this.estimateVehicleRouteIncome(vehicle, route).toLocaleString()}/hr
                                </span>
                            </div>
                            <button class="unassign-btn" data-action="unassign-from-route" data-vehicle-id="${vehicle.id}" data-route-id="${route.id}">
                                Unassign
                            </button>
                        </div>
                    `).join('') : '<p class="no-vehicles">No vehicles are currently assigned to this route.</p>'}
                </section>

                <section class="available-vehicles">
                    <h4>Ready for Dispatch (${availableVehicles.length})</h4>
                    ${availableVehicles.length > 0 ? availableVehicles.map(vehicle => `
                        <div class="vehicle-item glass-chip">
                            <div class="vehicle-info">
                                <span class="vehicle-name">${vehicle.name}</span>
                                <span class="vehicle-condition">
                                    ${vehicle.driver?.name || 'No driver'} • Cost Ksh ${this.estimateRouteCostForVehicle(vehicle, route).toLocaleString()} • Margin Ksh ${this.estimateVehicleRouteIncome(vehicle, route).toLocaleString()}/hr
                                </span>
                            </div>
                            <button class="assign-btn" data-action="assign-from-route" data-vehicle-id="${vehicle.id}" data-route-id="${route.id}">
                                Dispatch
                            </button>
                        </div>
                    `).join('') : '<p class="no-vehicles">No roadworthy vehicles with drivers can cover this route right now.</p>'}
                </section>
            </div>
        `;

        this.routeDetailsContainer.classList.remove('hidden');
    }

    showRouteSelector(vehicleId) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) {
            this.showToast('Vehicle not found.', 'error');
            return;
        }

        const availableRoutes = this.getRouteAnalysisForVehicle(vehicle);
        if (availableRoutes.length === 0) {
            this.showToast('No suitable routes available for this vehicle.', 'warning');
            return;
        }

        const modal = this.createModal(`
            <div class="route-selector-content glass-card">
                <h3>Assign ${vehicle.name}</h3>
                <div class="vehicle-info-summary glass-chip">
                    <span>⛽ ${Math.round(vehicle.fuel)}%</span>
                    <span>🔧 ${Math.round(vehicle.condition)}%</span>
                    <span>👨‍✈️ ${vehicle.driver?.name || 'No driver'}</span>
                </div>
                <div class="routes-list">
                    ${availableRoutes.map(entry => `
                        <article class="route-option glass-chip">
                            <div class="route-header">
                                <div>
                                    <h4>${entry.route.name}</h4>
                                    <p>${entry.demandLabel} demand • Trip cost Ksh ${entry.tripCost.toLocaleString()}</p>
                                </div>
                                <span class="route-distance">${entry.route.distance} km</span>
                            </div>
                            <div class="route-details">
                                <span>Fare Ksh ${entry.route.fare}</span>
                                <span>Risk ${entry.route.risk}/10</span>
                                <span>Margin Ksh ${entry.margin.toLocaleString()}/hr</span>
                            </div>
                            <button class="select-route-btn" data-action="assign-selected-route" data-vehicle-id="${vehicle.id}" data-route-id="${entry.route.id}">
                                Dispatch to ${entry.route.start}
                            </button>
                        </article>
                    `).join('')}
                </div>
                <button class="cancel-btn" data-action="close-modal">Cancel</button>
            </div>
        `, 'route-selector-modal');

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
                return;
            }

            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            if (actionButton.dataset.action === 'close-modal') {
                modal.remove();
                return;
            }

            if (actionButton.dataset.action === 'assign-selected-route') {
                this.game.assignVehicleToRoute(
                    parseInt(actionButton.dataset.vehicleId, 10),
                    actionButton.dataset.routeId
                );
                modal.remove();
            }
        });
    }

    manageDriver(vehicleId) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return;

        const driver = vehicle.driver;
        const hireFee = this.getDriverHireFee(vehicle);
        const modal = this.createModal(`
            <div class="driver-modal-content glass-card">
                <h3>${driver ? 'Edit Driver' : 'Hire Driver'}</h3>
                <p>${driver ? 'Update driver identity and pay rate.' : `Hire a driver for ${vehicle.name}. Sign-on cost Ksh ${hireFee.toLocaleString()}.`}</p>
                <div class="input-group">
                    <label for="driver-name-input">Driver Name</label>
                    <input id="driver-name-input" type="text" maxlength="24" value="${driver?.name || ''}" placeholder="Driver full name" />
                </div>
                <div class="modal-grid">
                    <div class="input-group">
                        <label for="driver-trait-input">Driving Style</label>
                        <input id="driver-trait-input" type="text" maxlength="30" value="${driver?.trait || ''}" placeholder="Calm under pressure" />
                    </div>
                    <div class="input-group">
                        <label for="driver-experience-input">Experience (1-10)</label>
                        <input id="driver-experience-input" type="number" min="1" max="10" value="${driver?.experience || 3}" />
                    </div>
                    <div class="input-group">
                        <label for="driver-salary-input">Salary / hr</label>
                        <input id="driver-salary-input" type="number" min="150" max="500" step="10" value="${driver?.salaryPerHour || 220}" />
                    </div>
                </div>
                <div class="modal-actions">
                    ${driver ? `<button class="danger-btn" data-action="remove-driver" data-vehicle-id="${vehicle.id}">Remove Driver</button>` : ''}
                    <button class="cancel-btn" data-action="close-modal">Cancel</button>
                    <button class="save-btn" data-action="save-driver" data-vehicle-id="${vehicle.id}">
                        ${driver ? 'Save Driver' : `Hire for Ksh ${hireFee.toLocaleString()}`}
                    </button>
                </div>
            </div>
        `, 'driver-modal');

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
                return;
            }

            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            if (actionButton.dataset.action === 'close-modal') {
                modal.remove();
                return;
            }

            if (actionButton.dataset.action === 'remove-driver') {
                if (vehicle.routeId) {
                    this.game.unassignVehicleFromRoute(vehicle.id, vehicle.routeId, true);
                }
                this.game.vehicleManager.clearDriver(vehicle.id);
                this.showToast(`${vehicle.name} now has no assigned driver.`, 'warning');
                this.update();
                modal.remove();
                return;
            }

            if (actionButton.dataset.action === 'save-driver') {
                const name = modal.querySelector('#driver-name-input')?.value?.trim() || '';
                const trait = modal.querySelector('#driver-trait-input')?.value?.trim() || '';
                const experience = parseInt(modal.querySelector('#driver-experience-input')?.value || '3', 10);
                const salaryPerHour = parseInt(modal.querySelector('#driver-salary-input')?.value || '220', 10);

                const saved = this.saveDriverProfile(vehicle.id, { name, trait, experience, salaryPerHour });
                if (saved) {
                    modal.remove();
                }
            }
        });
    }

    saveDriverProfile(vehicleId, driverProfile) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return false;

        if (!driverProfile.name) {
            this.showToast('Driver name cannot be empty.', 'error');
            return false;
        }

        const isNewDriver = !vehicle.driver;
        const hireFee = isNewDriver ? this.getDriverHireFee(vehicle) : 0;

        if (isNewDriver && !this.game.economy.spendCash(hireFee)) {
            this.showToast('Not enough cash to hire that driver.', 'error');
            return false;
        }

        const normalizedProfile = {
            name: driverProfile.name,
            trait: driverProfile.trait || 'Reliable on busy corridors',
            experience: Math.max(1, Math.min(10, Number(driverProfile.experience) || 3)),
            salaryPerHour: Math.max(150, Math.min(500, Number(driverProfile.salaryPerHour) || 220)),
            hiredAt: vehicle.driver?.hiredAt || Date.now()
        };

        this.game.vehicleManager.updateDriver(vehicleId, normalizedProfile);

        if (isNewDriver) {
            this.game.progressionManager?.recordDriverHire();
            this.showToast(`${normalizedProfile.name} hired for ${vehicle.name}.`, 'success');
        } else {
            this.showToast(`Driver profile updated for ${vehicle.name}.`, 'success');
        }

        this.game.progressionManager?.evaluateProgress();
        this.update();
        return true;
    }

    editVehicleNickname(vehicleId) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return;

        const modal = this.createModal(`
            <div class="nickname-modal-content glass-card">
                <h3>Edit Vehicle Nickname</h3>
                <p>Visible on the map and dispatch screens for <strong>${vehicle.name}</strong>.</p>
                <div class="input-group">
                    <label for="nickname-input">Map Call Sign</label>
                    <input id="nickname-input" type="text" value="${vehicle.nickname || this.generateDefaultNickname(vehicle.name)}" maxlength="8" />
                    <small>Keep it short. 8 characters max.</small>
                </div>
                <div class="modal-actions">
                    <button class="cancel-btn" data-action="close-modal">Cancel</button>
                    <button class="save-btn" data-action="save-nickname" data-vehicle-id="${vehicle.id}">Save</button>
                </div>
            </div>
        `);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
                return;
            }

            const actionButton = event.target.closest('button[data-action]');
            if (!actionButton) return;

            if (actionButton.dataset.action === 'close-modal') {
                modal.remove();
                return;
            }

            if (actionButton.dataset.action === 'save-nickname') {
                const input = modal.querySelector('#nickname-input');
                const saved = this.saveVehicleNickname(parseInt(actionButton.dataset.vehicleId, 10), input?.value || '');
                if (saved) {
                    modal.remove();
                }
            }
        });
    }

    saveVehicleNickname(vehicleId, nickname) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return false;

        const cleanNickname = nickname.trim().substring(0, 8);
        if (!cleanNickname) {
            this.showToast('Nickname cannot be empty.', 'error');
            return false;
        }

        vehicle.nickname = cleanNickname;
        this.showToast(`Map call sign updated to "${cleanNickname}".`, 'success');
        this.update();

        if (this.game.components.map) {
            this.game.components.map.updateVehiclePositions();
        }
        return true;
    }

    refuelVehicle(vehicleId) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return;

        const fuelNeeded = 100 - vehicle.fuel;
        const refuelCost = Math.round(fuelNeeded * 20);
        if (fuelNeeded <= 0) {
            this.showToast('Fuel tank is already full.', 'info');
            return;
        }

        if (!this.game.economy.spendCash(refuelCost)) {
            this.showToast('Not enough cash for refueling.', 'error');
            return;
        }

        vehicle.fuel = 100;
        this.game.progressionManager?.recordFuelSpend(refuelCost);
        this.showToast(`${vehicle.name} refueled for Ksh ${refuelCost.toLocaleString()}.`, 'success');
        this.update();
    }

    repairVehicle(vehicleId) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return;

        const conditionNeeded = 100 - vehicle.condition;
        const repairCost = Math.round(conditionNeeded * 100);
        if (conditionNeeded <= 0) {
            this.showToast('Vehicle is already in excellent condition.', 'info');
            return;
        }

        if (!this.game.economy.spendCash(repairCost)) {
            this.showToast('Not enough cash for repairs.', 'error');
            return;
        }

        vehicle.condition = 100;
        if (vehicle.status === 'breakdown') {
            vehicle.status = 'idle';
        }

        this.game.progressionManager?.recordRepairSpend(repairCost);
        this.showToast(`${vehicle.name} repaired for Ksh ${repairCost.toLocaleString()}.`, 'success');
        this.update();
    }

    sellVehicle(vehicleId) {
        const vehicle = this.game.vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return;

        const vehicles = this.game.vehicleManager.getVehicles();
        if (vehicles.length <= 1) {
            this.showToast('You cannot sell the last active asset in the business.', 'error');
            return;
        }

        const vehicleType = this.game.vehicleManager.getVehicleType(vehicle.typeId);
        const sellValue = vehicleType ? Math.round(vehicleType.cost * 0.6) : 1000;

        if (!confirm(`Sell ${vehicle.name} for Ksh ${sellValue.toLocaleString()}?`)) {
            return;
        }

        if (vehicle.routeId) {
            this.game.unassignVehicleFromRoute(vehicle.id, vehicle.routeId, true);
        }

        this.game.vehicleManager.removeVehicle(vehicleId);
        this.game.economy.addCash(sellValue);
        this.showToast(`${vehicle.name} sold for Ksh ${sellValue.toLocaleString()}.`, 'success');
        this.update();

        if (this.game.components.map) {
            this.game.components.map.updateVehiclePositions();
        }
    }

    getRouteMarketData() {
        return this.game.routeManager.getAllRoutes()
            .map(route => {
                const tripCost = this.estimateRouteBaseCost(route);
                const revenue = this.estimateRouteBaseRevenue(route);
                return {
                    route,
                    tripCost,
                    revenue,
                    margin: Math.max(0, revenue - tripCost),
                    demandLabel: route.passengerFlow >= 8 ? 'High' : route.passengerFlow >= 5 ? 'Medium' : 'Low'
                };
            })
            .sort((left, right) =>
                right.route.passengerFlow - left.route.passengerFlow ||
                left.tripCost - right.tripCost ||
                right.margin - left.margin
            )
            .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }

    getRouteAnalysisForVehicle(vehicle) {
        const vehicleType = this.game.vehicleManager.getVehicleType(vehicle.typeId);
        return this.game.routeManager.getAllRoutes()
            .filter(route => (vehicleType?.maxDistance || 100) >= route.distance)
            .map(route => ({
                route,
                tripCost: this.estimateRouteCostForVehicle(vehicle, route),
                margin: this.estimateVehicleRouteIncome(vehicle, route),
                demandLabel: route.passengerFlow >= 8 ? 'High' : route.passengerFlow >= 5 ? 'Medium' : 'Low'
            }))
            .sort((left, right) =>
                right.route.passengerFlow - left.route.passengerFlow ||
                left.tripCost - right.tripCost ||
                right.margin - left.margin
            );
    }

    canVehicleServeRoute(vehicle, route) {
        const vehicleType = this.game.vehicleManager.getVehicleType(vehicle.typeId);
        return !vehicle.routeId &&
            vehicle.status !== 'breakdown' &&
            vehicle.status !== 'out_of_fuel' &&
            vehicle.fuel > 10 &&
            vehicle.condition > 25 &&
            Boolean(vehicle.driver?.name) &&
            (vehicleType?.maxDistance || 100) >= route.distance;
    }

    estimateVehicleRouteIncome(vehicle, route) {
        const previewVehicle = {
            ...vehicle,
            driver: vehicle.driver || { salaryPerHour: 220 }
        };
        const preview = this.game.economy.calculateTick(previewVehicle, route, 12);
        return Math.round(Math.max(0, preview.profit) * 5);
    }

    estimateRouteCostForVehicle(vehicle, route) {
        const previewVehicle = {
            ...vehicle,
            fuel: 100,
            condition: Math.max(70, vehicle.condition || 100),
            driver: vehicle.driver || { salaryPerHour: 220 }
        };
        const preview = this.game.economy.calculateTick(previewVehicle, route, 12);
        return Math.round((preview.operatingCost || 0) * 5);
    }

    estimateVehicleStandaloneYield(vehicleType) {
        if (!vehicleType) return 0;

        const pseudoVehicle = {
            id: 0,
            typeId: vehicleType.id,
            fuel: 100,
            condition: 100,
            driver: { salaryPerHour: 220 }
        };

        const bestRoute = this.getRouteAnalysisForVehicle(pseudoVehicle)[0];
        return bestRoute ? bestRoute.margin : 0;
    }

    estimateRouteBaseRevenue(route) {
        return Math.round((route.fare || 50) * (route.passengerFlow || 5) * 6);
    }

    estimateRouteBaseCost(route) {
        return Math.round((route.distance * 60) + (route.risk * 120));
    }

    getDriverHireFee(vehicle) {
        const vehicleType = this.game.vehicleManager.getVehicleType(vehicle.typeId);
        return 2500 + ((vehicleType?.capacity || 14) * 70);
    }

    formatContractProgress(value) {
        if (typeof value === 'number' && !Number.isInteger(value)) {
            return value.toFixed(1);
        }
        return String(value);
    }

    getProgressionRenderSignature(data) {
        return [
            data.contracts.map(contract => `${contract.id}:${contract.claimed ? 1 : 0}`).join('|'),
            data.nextMilestone?.id || 'no-milestone',
            data.trackers.map(tracker => tracker.id).join('|')
        ].join('::');
    }

    getRiskLabel(risk) {
        if (risk >= 8) return 'High-risk corridor';
        if (risk >= 5) return 'Moderate operational risk';
        return 'Stable corridor';
    }

    generateDefaultNickname(fullName) {
        const words = fullName.split(' ');
        if (words.length >= 2) {
            return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
        }
        return fullName.substring(0, 3).toUpperCase();
    }

    getStatusColor(status) {
        const colors = {
            idle: '#ff9800',
            running: '#4caf50',
            breakdown: '#f44336',
            out_of_fuel: '#ff7043',
            maintenance: '#9c27b0'
        };
        return colors[status] || '#607d8b';
    }

    createModal(content, className = '') {
        const modal = document.createElement('div');
        modal.className = `modal-container ${className}`.trim();
        modal.innerHTML = content;
        document.body.appendChild(modal);
        return modal;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };

        toast.style.background = colors[type] || colors.info;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    setText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    setContainerText(container, selector, text) {
        const element = container.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }

    setContainerStyle(container, selector, property, value) {
        const element = container.querySelector(selector);
        if (element) {
            element.style[property] = value;
        }
    }
}
