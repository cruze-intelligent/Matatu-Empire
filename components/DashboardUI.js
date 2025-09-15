export class DashboardUI {
    constructor(game) {
        this.game = game;
        this.dashboardContainer = document.getElementById('dashboard-container');
        this.fleetContainer = document.getElementById('fleet-container');
        this.fleetList = document.getElementById('fleet-list');
        this.buyVehicleModal = document.getElementById('buy-vehicle-modal');
        this.buyVehicleList = document.getElementById('buy-vehicle-list');
        this.routeDetailsContainer = document.getElementById('route-details-container');
        
        if (!this.dashboardContainer || !this.fleetContainer) {
            console.error('Required dashboard elements not found');
            return;
        }
        
        this.initializeEventListeners();
        console.log('✅ DashboardUI initialized');
    }

    initializeEventListeners() {
        // Setup buy vehicle button
        this.setupBuyVehicleButton();
        
        // Setup buy vehicle modal
        this.setupBuyVehicleModal();
        
        // Setup route details handling
        this.setupRouteDetailsEventHandling();
        
        // Setup game controls
        this.setupGameControls();
    }

    setupBuyVehicleButton() {
        const buyBtn = document.getElementById('buy-matatu-btn');
        if (buyBtn) {
            // Remove existing listeners
            buyBtn.replaceWith(buyBtn.cloneNode(true));
            const newBuyBtn = document.getElementById('buy-matatu-btn');
            
            newBuyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Buy vehicle button clicked');
                this.showBuyVehicleModal();
            });
            
            console.log('✅ Buy vehicle button setup complete');
        } else {
            console.error('Buy matatu button not found');
        }
    }

    setupBuyVehicleModal() {
        if (!this.buyVehicleModal) {
            console.error('Buy vehicle modal not found');
            return;
        }
        
        // Setup close button
        const closeBtn = this.buyVehicleModal.querySelector('#close-buy-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideBuyVehicleModal();
            });
        }
        
        // Setup modal background click
        this.buyVehicleModal.addEventListener('click', (e) => {
            if (e.target === this.buyVehicleModal) {
                this.hideBuyVehicleModal();
            }
        });
        
        console.log('✅ Buy vehicle modal setup complete');
    }

    showBuyVehicleModal() {
        if (!this.buyVehicleModal || !this.buyVehicleList) {
            console.error('Buy vehicle modal or list not found');
            return;
        }
        
        console.log('Showing buy vehicle modal');
        
        // Get vehicle types and player cash
        const vehicleTypes = this.game.managers.vehicle.getVehicleTypes();
        const playerCash = this.game.managers.economy.getPlayerState().cash;
        
        if (!vehicleTypes || vehicleTypes.length === 0) {
            console.error('No vehicle types available');
            this.buyVehicleList.innerHTML = '<p style="color: var(--text-secondary);">No vehicles available for purchase.</p>';
        } else {
            console.log('Rendering vehicle types:', vehicleTypes.length);
            this.renderVehicleTypes(vehicleTypes, playerCash);
        }
        
        // Show modal
        this.buyVehicleModal.classList.remove('hidden');
        this.buyVehicleModal.style.display = 'flex';
    }

    hideBuyVehicleModal() {
        if (this.buyVehicleModal) {
            this.buyVehicleModal.classList.add('hidden');
            this.buyVehicleModal.style.display = 'none';
        }
    }

    renderVehicleTypes(vehicleTypes, playerCash) {
        this.buyVehicleList.innerHTML = vehicleTypes.map(vehicleType => {
            const canAfford = playerCash >= vehicleType.cost;
            const affordabilityClass = canAfford ? 'affordable' : 'unaffordable';
            
            return `
                <div class="vehicle-type-card ${affordabilityClass}" data-type-id="${vehicleType.id}">
                    <div class="vehicle-type-header">
                        <h3 class="vehicle-type-name">${vehicleType.name}</h3>
                        <div class="vehicle-type-price">
                            <span class="currency">Ksh</span>
                            <span class="amount">${vehicleType.cost.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="vehicle-type-stats">
                        <div class="stat-row">
                            <span class="stat-label">🛣️ Max Distance:</span>
                            <span class="stat-value">${vehicleType.maxDistance || 100} km</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">👥 Capacity:</span>
                            <span class="stat-value">${vehicleType.capacity} passengers</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">⛽ Fuel Efficiency:</span>
                            <span class="stat-value">${vehicleType.fuelEfficiency || vehicleType.reliability}/10</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">🔧 Reliability:</span>
                            <span class="stat-value">${vehicleType.reliability}/10</span>
                        </div>
                    </div>
                    
                    <div class="vehicle-type-description">
                        <p>${vehicleType.description}</p>
                    </div>
                    
                    <button class="buy-vehicle-btn ${canAfford ? 'enabled' : 'disabled'}" 
                            ${canAfford ? '' : 'disabled'}
                            onclick="window.gameInstance.components.dashboard.purchaseVehicle('${vehicleType.id}')">
                        ${canAfford ? `🛒 Buy for Ksh ${vehicleType.cost.toLocaleString()}` : '💰 Insufficient Funds'}
                    </button>
                </div>
            `;
        }).join('');
    }

    purchaseVehicle(typeId) {
        console.log('Attempting to purchase vehicle type:', typeId);
        
        if (!this.game.managers.vehicle || !this.game.managers.economy) {
            console.error('Required managers not available');
            return;
        }
        
        const vehicleType = this.game.managers.vehicle.getVehicleType(typeId);
        if (!vehicleType) {
            console.error('Vehicle type not found:', typeId);
            this.showToast('Vehicle type not found!', 'error');
            return;
        }
        
        const playerCash = this.game.managers.economy.getPlayerState().cash;
        if (playerCash < vehicleType.cost) {
            this.showToast('Insufficient funds!', 'error');
            return;
        }
        
        // Spend the money
        if (this.game.managers.economy.spendCash(vehicleType.cost)) {
            // Buy the vehicle
            const newVehicle = this.game.managers.vehicle.buyVehicle(typeId);
            
            if (newVehicle) {
                console.log('Vehicle purchased successfully:', newVehicle);
                this.showToast(`${vehicleType.name} purchased successfully!`, 'success');
                this.hideBuyVehicleModal();
                this.update(); // Refresh the dashboard
                
                // Add driver message
                if (this.game.components.driverMessages) {
                    this.game.components.driverMessages.showMessage(
                        newVehicle.nickname || newVehicle.name,
                        `Thanks boss! Ready to hit the road and make money!`,
                        'positive'
                    );
                }
            } else {
                console.error('Failed to create vehicle');
                this.game.managers.economy.addCash(vehicleType.cost); // Refund
                this.showToast('Failed to purchase vehicle!', 'error');
            }
        } else {
            this.showToast('Transaction failed!', 'error');
        }
    }

    updateFleet() {
        if (!this.fleetList || !this.game.managers.vehicle) {
            return;
        }
        
        const vehicles = this.game.managers.vehicle.getVehicles();
        
        // Store current scroll position to prevent auto-scroll
        const currentScrollTop = this.fleetList.scrollTop;
        
        if (vehicles.length === 0) {
            this.fleetList.innerHTML = `
                <div class="empty-fleet-message">
                    <div class="empty-icon">🚐</div>
                    <h3>No vehicles in your fleet</h3>
                    <p>Buy your first matatu to get started!</p>
                </div>
            `;
            return;
        }
        
        const vehicleHTML = vehicles.map(vehicle => {
            const route = vehicle.routeId ? this.game.managers.route.getRouteById(vehicle.routeId) : null;
            const statusColor = this.getStatusColor(vehicle.status);
            const nickname = vehicle.nickname || this.generateDefaultNickname(vehicle.name);
            
            // Warning indicators
            const fuelWarning = vehicle.fuel < 30 ? '⚠️' : '';
            const conditionWarning = vehicle.condition < 50 ? '🔧' : '';
            const maintenanceWarning = (fuelWarning || conditionWarning) ? 
                `<span class="maintenance-warning">${fuelWarning}${conditionWarning}</span>` : '';
            
            return `
                <div class="vehicle-card fade-in" data-vehicle-id="${vehicle.id}">
                    <div class="vehicle-card-header">
                        <div class="vehicle-title">
                            <h4 class="vehicle-name">${vehicle.name}</h4>
                            ${maintenanceWarning}
                        </div>
                        <span class="vehicle-status" style="background: ${statusColor};">
                            ${vehicle.status.replace('_', ' ')}
                        </span>
                    </div>
                    
                    <div class="vehicle-nickname-display">
                        <span class="nickname-label">Map Display:</span>
                        <span class="nickname-value">${nickname}</span>
                    </div>
                    
                    <div class="vehicle-stats">
                        <div class="stat">
                            <span class="label">⛽ Fuel:</span>
                            <span class="value ${vehicle.fuel < 30 ? 'warning' : ''}">${Math.round(vehicle.fuel)}%</span>
                        </div>
                        <div class="stat">
                            <span class="label">🔧 Condition:</span>
                            <span class="value ${vehicle.condition < 50 ? 'danger' : ''}">${Math.round(vehicle.condition)}%</span>
                        </div>
                        <div class="stat">
                            <span class="label">🛣️ Route:</span>
                            <span class="value">${route ? route.name : 'None'}</span>
                        </div>
                        <div class="stat">
                            <span class="label">💰 Earnings:</span>
                            <span class="value">Ksh ${(vehicle.totalEarnings || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    ${this.renderVehicleActions(vehicle)}
                </div>
            `;
        }).join('');
        
        // Only update if content has changed to prevent unnecessary re-renders
        if (this.fleetList.innerHTML !== vehicleHTML) {
            this.fleetList.innerHTML = vehicleHTML;
            
            // Restore scroll position to prevent auto-scroll
            this.fleetList.scrollTop = currentScrollTop;
        }
    }

    renderVehicleActions(vehicle) {
        const vehicleType = this.game.managers.vehicle.getVehicleType(vehicle.typeId);
        const sellValue = vehicleType ? Math.round(vehicleType.cost * 0.6) : 1000;
        let actions = '';

        if (vehicle.status === 'running') {
            actions += `<button class="unassign-btn" onclick="window.gameInstance.unassignVehicleFromRoute(${vehicle.id}, '${vehicle.routeId}')">
                ⏹️ Stop
            </button>`;
        } else {
            actions += `<button class="assign-btn" onclick="window.gameInstance.components.dashboard.showRouteSelector(${vehicle.id})">
                ▶️ Assign Route
            </button>`;
        }

        // Add Repair button if needed
        if (vehicle.condition < 100) {
            const repairCost = Math.round((100 - vehicle.condition) * 100);
            actions += `<button class="repair-btn" onclick="window.gameInstance.components.dashboard.repairVehicle(${vehicle.id})">
                🔧 Repair (Ksh ${repairCost.toLocaleString()})
            </button>`;
        }

        if (vehicle.fuel < 100) {
            const refuelCost = Math.round((100 - vehicle.fuel) * 20);
            actions += `<button class="refuel-btn" onclick="window.gameInstance.components.dashboard.refuelVehicle(${vehicle.id})">
                ⛽ Refuel (Ksh ${refuelCost.toLocaleString()})
            </button>`;
        }

        actions += `<button class="nickname-btn" onclick="window.gameInstance.components.dashboard.editVehicleNickname(${vehicle.id})">
            ✏️ Nickname
        </button>`;
        actions += `<button class="sell-btn" onclick="window.gameInstance.components.dashboard.sellVehicle(${vehicle.id})">
            💰 Sell (Ksh ${sellValue.toLocaleString()})
        </button>`;

        return `<div class="vehicle-actions">${actions}</div>`;
    }

    setupGameControls() {
        const saveBtn = document.getElementById('save-game');
        const resetBtn = document.getElementById('reset-game');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.game.saveGame) {
                    this.game.saveGame();
                }
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset the game? All progress will be lost!')) {
                    this.game.resetGame();
                }
            });
        }
    }

    setupRouteDetailsEventHandling() {
        // Remove existing listeners to prevent duplicates
        const existingContainer = document.getElementById('route-details-container');
        if (existingContainer) {
            // Clone to remove all event listeners
            const newContainer = existingContainer.cloneNode(true);
            existingContainer.parentNode.replaceChild(newContainer, existingContainer);
            this.routeDetailsContainer = newContainer;
        }
        
        if (this.routeDetailsContainer) {
            this.routeDetailsContainer.addEventListener('click', (e) => {
                this.handleRouteDetailsClick(e);
            });
        }
        
        console.log('✅ Route details event handling setup complete');
    }

    handleRouteDetailsClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Handle close button
        if (e.target.classList.contains('route-close-btn') || e.target.closest('.route-close-btn')) {
            this.routeDetailsContainer.classList.add('hidden');
            return;
        }
        
        // Handle assign/unassign buttons with better error handling
        const assignBtn = e.target.closest('.assign-btn');
        const unassignBtn = e.target.closest('.unassign-btn');
        
        if (assignBtn) {
            const vehicleId = parseInt(assignBtn.dataset.vid);
            const routeId = assignBtn.dataset.rid;
            
            if (vehicleId && routeId) {
                try {
                    this.game.assignVehicleToRoute(vehicleId, routeId);
                    this.routeDetailsContainer.classList.add('hidden');
                } catch (error) {
                    console.error('Error assigning vehicle:', error);
                    this.showToast('Failed to assign vehicle to route', 'error');
                }
            }
        } else if (unassignBtn) {
            const vehicleId = parseInt(unassignBtn.dataset.vid);
            const routeId = unassignBtn.dataset.rid;
            
            if (vehicleId && routeId) {
                try {
                    this.game.unassignVehicleFromRoute(vehicleId, routeId);
                    this.routeDetailsContainer.classList.add('hidden');
                } catch (error) {
                    console.error('Error unassigning vehicle:', error);
                    this.showToast('Failed to unassign vehicle from route', 'error');
                }
            }
        }
    }

    showRouteDetails(route) {
        if (!route || !this.routeDetailsContainer) return;
        
        // Store the current route ID for updates
        this.routeDetailsContainer.dataset.currentRouteId = route.id;
        
        const vehicles = this.game.managers.vehicle.getVehicles();
        const availableVehicles = vehicles.filter(v => 
            v.status === 'idle' || 
            (v.status !== 'breakdown' && v.fuel > 10 && v.condition > 20)
        );
        const assignedVehicles = vehicles.filter(v => v.routeId === route.id);
        
        this.routeDetailsContainer.innerHTML = `
            <div class="route-details-content">
                <div class="route-details-header">
                    <h3>🛣️ ${route.name}</h3>
                    <button class="route-close-btn">×</button>
                </div>
                <div class="route-info">
                    <div class="route-stats">
                        <div class="stat">
                            <span class="label">📍 From:</span>
                            <span class="value">${route.start}</span>
                        </div>
                        <div class="stat">
                            <span class="label">📍 To:</span>
                            <span class="value">${route.end}</span>
                        </div>
                        <div class="stat">
                            <span class="label">📏 Distance:</span>
                            <span class="value">${route.distance} km</span>
                        </div>
                        <div class="stat">
                            <span class="label">👥 Passenger Flow:</span>
                            <span class="value">${route.passengerFlow}/10</span>
                        </div>
                        <div class="stat">
                            <span class="label">💰 Fare:</span>
                            <span class="value">Ksh ${route.fare}</span>
                        </div>
                        <div class="stat">
                            <span class="label">⚠️ Risk Level:</span>
                            <span class="value">${route.risk}/10</span>
                        </div>
                    </div>
                    <div class="assigned-vehicles">
                        <h4>🚐 Currently Assigned (${assignedVehicles.length})</h4>
                        ${assignedVehicles.map(vehicle => `
                            <div class="vehicle-item">
                                <div class="vehicle-info">
                                    <span class="vehicle-name">${vehicle.name}</span>
                                    <span class="vehicle-condition">
                                        ⛽${Math.round(vehicle.fuel)}% 🔧${Math.round(vehicle.condition)}% Status: ${vehicle.status}
                                    </span>
                                </div>
                                <button class="unassign-btn" data-vid="${vehicle.id}" data-rid="${route.id}">
                                    Unassign
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="available-vehicles">
                        <h4>🎯 Available Vehicles (${availableVehicles.length})</h4>
                        ${availableVehicles.length > 0 ? `
                            ${availableVehicles.map(vehicle => `
                                <div class="vehicle-item">
                                    <div class="vehicle-info">
                                        <span class="vehicle-name">${vehicle.name}</span>
                                        <span class="vehicle-condition">
                                            ⛽${Math.round(vehicle.fuel)}% 🔧${Math.round(vehicle.condition)}%
                                        </span>
                                    </div>
                                    <button class="assign-btn" data-vid="${vehicle.id}" data-rid="${route.id}">
                                        Assign
                                    </button>
                                </div>
                            `).join('')}
                        ` : '<p class="no-vehicles">No available vehicles. Purchase more or repair existing ones.</p>'}
                    </div>
                </div>
            </div>
        `;
        
        this.routeDetailsContainer.classList.remove('hidden');
    }

    showRouteSelector(vehicleId) {
        console.log('Showing route selector for vehicle:', vehicleId);

        const vehicle = this.game.managers.vehicle.getVehicleById(vehicleId);
        if (!vehicle) {
            this.showToast('Vehicle not found!', 'error');
            return;
        }

        const routes = this.game.managers.route.getAllRoutes();
        const availableRoutes = routes.filter(route => {
            const vehicleType = this.game.managers.vehicle.getVehicleType(vehicle.typeId);
            return vehicleType && route.distance <= (vehicleType.maxDistance || 100);
        });

        if (availableRoutes.length === 0) {
            this.showToast('No suitable routes available for this vehicle!', 'warning');
            return;
        }

        const modalHTML = `
            <div class="route-selector-content">
                <h3>🛣️ Select Route for ${vehicle.name}</h3>
                <div class="vehicle-info-summary">
                    <span>⛽ ${Math.round(vehicle.fuel)}%</span>
                    <span>🔧 ${Math.round(vehicle.condition)}%</span>
                    <span>📏 Max Distance: ${this.game.managers.vehicle.getVehicleType(vehicle.typeId)?.maxDistance || 100} km</span>
                </div>
                <div class="routes-list">
                    ${availableRoutes.map(route => `
                        <div class="route-option" data-route-id="${route.id}">
                            <div class="route-header">
                                <h4>${route.name}</h4>
                                <span class="route-distance">${route.distance} km</span>
                            </div>
                            <div class="route-details">
                                <span>👥 ${route.passengerFlow}/10</span>
                                <span>💰 Ksh ${route.fare}</span>
                                <span>⚠️ ${route.risk}/10</span>
                            </div>
                            <button class="select-route-btn" onclick="window.gameInstance.assignVehicleToRoute(${vehicleId}, '${route.id}'); this.closest('.modal-container').remove();">
                                Assign to Route
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="cancel-btn" onclick="this.closest('.modal-container').remove();">
                    Cancel
                </button>
            </div>
        `;

        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-container route-selector-modal';
        modalDiv.innerHTML = modalHTML;
        modalDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2500;
            padding: 20px;
        `;
        document.body.appendChild(modalDiv);

        // Add styles for the route selector if they don't exist
        if (!document.getElementById('route-selector-styles')) {
            const style = document.createElement('style');
            style.id = 'route-selector-styles';
            style.textContent = `
                .route-selector-content {
                    background: var(--bg-dark);
                    border: 2px solid var(--primary-color);
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    color: var(--text-primary);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                }
                .route-selector-content h3 {
                    color: var(--primary-color);
                    margin-bottom: 1rem;
                    text-align: center;
                }
                .vehicle-info-summary {
                    display: flex;
                    justify-content: space-around;
                    background: rgba(255,255,255,0.1);
                    padding: 0.8rem;
                    border-radius: 6px;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    border: 1px solid var(--border-color);
                }
                .routes-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .route-option {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    transition: all 0.2s ease;
                }
                .route-option:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: var(--primary-color);
                }
                .route-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .route-header h4 {
                    margin: 0;
                    color: var(--text-primary);
                }
                .route-distance {
                    color: var(--primary-color);
                    font-weight: 600;
                    background: rgba(255,193,7,0.2);
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }
                .route-details {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .select-route-btn {
                    width: 100%;
                    background: var(--secondary-color);
                    color: white;
                    border: none;
                    padding: 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                .select-route-btn:hover {
                    background: #388e3c;
                    transform: translateY(-1px);
                }
                .cancel-btn {
                    margin-top: 1rem;
                    background: var(--danger-color, #f44336);
                    color: white;
                    border: none;
                    padding: 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    width: 100%;
                }
            `;
            document.head.appendChild(style);
        }
    }

    refuelVehicle(vehicleId) {
        const vehicle = this.game.managers.vehicle.getVehicleById(vehicleId);
        if (!vehicle) return;

        const fuelNeeded = 100 - vehicle.fuel;
        const refuelCost = Math.round(fuelNeeded * 20);
        if (fuelNeeded <= 0) {
            this.showToast('Vehicle fuel is already full!', 'info');
            return;
        }

        if (this.game.managers.economy.spendCash(refuelCost)) {
            vehicle.fuel = 100;
            this.showToast(`${vehicle.name} refueled for Ksh ${refuelCost.toLocaleString()}!`, 'success');
            this.update();

            if (this.game.components.driverMessages) {
                this.game.components.driverMessages.showMessage(
                    vehicle.nickname || vehicle.name,
                    'Thanks boss! Tank is full and ready to roll!',
                    'positive'
                );
            }
        } else {
            this.showToast('Not enough cash for refueling!', 'error');
        }
    }

    repairVehicle(vehicleId) {
        const vehicle = this.game.managers.vehicle.getVehicleById(vehicleId);
        if (!vehicle) return;

        const conditionNeeded = 100 - vehicle.condition;
        const repairCost = Math.round(conditionNeeded * 100);

        if (conditionNeeded <= 0) {
            this.showToast('Vehicle is already in perfect condition!', 'info');
            return;
        }

        if (this.game.managers.economy.spendCash(repairCost)) {
            vehicle.condition = 100;
            if (vehicle.status === 'breakdown') {
                vehicle.status = 'idle';
            }
            this.showToast(`${vehicle.name} repaired for Ksh ${repairCost.toLocaleString()}!`, 'success');
            this.update();
            if (this.game.components.driverMessages) {
                this.game.components.driverMessages.showMessage(
                    vehicle.nickname || vehicle.name,
                    `Feeling like new again! Condition improved to 100%!`,
                    'positive'
                );
            }
        } else {
            this.showToast('Not enough cash for repairs!', 'error');
        }
    }

    editVehicleNickname(vehicleId) {
        const vehicle = this.game.managers.vehicle.getVehicleById(vehicleId);
        if (!vehicle) return;

        const currentNickname = vehicle.nickname || this.generateDefaultNickname(vehicle.name);
        
        const modalHTML = `
            <div class="nickname-modal-content">
                <h3>✏️ Edit Vehicle Nickname</h3>
                <p>Current: <strong>${vehicle.name}</strong></p>
                <div class="input-group">
                    <label>Map Display Name:</label>
                    <input type="text" id="nickname-input" value="${currentNickname}" maxlength="8" 
                           placeholder="Max 8 characters">
                    <small>This nickname will appear on the map when the vehicle is running.</small>
                </div>
                <div class="modal-actions">
                    <button class="cancel-btn" onclick="this.closest('.modal-container').remove();">
                        Cancel
                    </button>
                    <button class="save-btn" onclick="window.gameInstance.components.dashboard.saveVehicleNickname(${vehicleId}, document.getElementById('nickname-input').value); this.closest('.modal-container').remove();">
                        Save
                    </button>
                </div>
            </div>
        `;

        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-container';
        modalDiv.innerHTML = modalHTML;
        modalDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
        `;
        document.body.appendChild(modalDiv);

        setTimeout(() => {
            const input = document.getElementById('nickname-input');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    }

    saveVehicleNickname(vehicleId, nickname) {
        const vehicle = this.game.managers.vehicle.getVehicleById(vehicleId);
        if (!vehicle) return;

        const cleanNickname = nickname.trim().substring(0, 8);
        if (cleanNickname.length === 0) {
            this.showToast('Nickname cannot be empty!', 'error');
            return;
        }

        vehicle.nickname = cleanNickname;
        this.showToast(`Vehicle nickname updated to "${cleanNickname}"!`, 'success');
        this.update();

        if (this.game.components.map) {
            this.game.components.map.updateVehiclePositions();
        }
    }

    sellVehicle(vehicleId) {
        const vehicle = this.game.managers.vehicle.getVehicleById(vehicleId);
        if (!vehicle) return;

        const vehicleType = this.game.managers.vehicle.getVehicleType(vehicle.typeId);
        const sellValue = vehicleType ? Math.round(vehicleType.cost * 0.6) : 1000;

        const allVehicles = this.game.managers.vehicle.getVehicles();
        if (allVehicles.length <= 1) {
            this.showToast('Cannot sell your last vehicle! You need at least one matatu to run your business.', 'error');
            return;
        }

        if (confirm(`Sell ${vehicle.name} for Ksh ${sellValue.toLocaleString()}? This action cannot be undone.`)) {
            if (vehicle.routeId) {
                this.game.unassignVehicleFromRoute(vehicleId, vehicle.routeId);
            }
            
            this.game.managers.economy.addCash(sellValue);
            this.game.managers.vehicle.removeVehicle(vehicleId);
            this.showToast(`Sold ${vehicle.name} for Ksh ${sellValue.toLocaleString()}!`, 'success');
            this.update();
            
            if (this.game.components.map) {
                this.game.components.map.updateVehiclePositions();
            }
        }
    }

    generateDefaultNickname(fullName) {
        const words = fullName.split(' ');
        if (words.length >= 2) {
            return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
        } else {
            return fullName.substring(0, 3).toUpperCase();
        }
    }

    getStatusColor(status) {
        const colors = {
            'idle': '#ffa500',
            'running': '#4CAF50',
            'breakdown': '#f44336',
            'out_of_fuel': '#ff9800',
            'maintenance': '#9c27b0'
        };
        return colors[status] || '#666';
    }

    updateStats() {
        const vehicles = this.game.managers.vehicle.getVehicles();
        const activeVehicles = vehicles.filter(v => v.status === 'running').length;
        const cashElement = document.getElementById('cash-display');
        if (cashElement) {
            cashElement.textContent = `Ksh ${this.game.managers.economy.getPlayerState().cash.toLocaleString()}`;
        }
        const reputationElement = document.getElementById('reputation-display');
        if (reputationElement) {
            reputationElement.textContent = `${this.game.managers.economy.getPlayerState().reputation}/100`;
        }
        const dailyProfitElement = document.getElementById('daily-profit');
        if (dailyProfitElement) {
            dailyProfitElement.textContent = `Ksh ${this.game.managers.economy.getPlayerState().dailyProfit.toLocaleString()}`;
        }
        const totalEarningsElement = document.getElementById('total-earnings');
        if (totalEarningsElement) {
            totalEarningsElement.textContent = `Ksh ${this.game.managers.economy.getPlayerState().totalEarningsAllTime.toLocaleString()}`;
        }
        const activeVehiclesElement = document.getElementById('active-vehicles');
        if (activeVehiclesElement) {
            activeVehiclesElement.textContent = `${activeVehicles}/${vehicles.length}`;
        }
    }
        
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            background: ${colors[type] || colors.info};
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.2);
        `;

        // Responsive positioning for mobile
        if (window.innerWidth <= 768) {
            toast.style.cssText += `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                right: auto;
                max-width: 90vw;
                text-align: center;
            `;
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.style.opacity = '1', 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    update() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            this.updateStats();
            this.updateFleet();

            // Update route details if open
            if (this.routeDetailsContainer && !this.routeDetailsContainer.classList.contains('hidden')) {
                // Find current route and refresh details
                const routeId = this.routeDetailsContainer.dataset.currentRouteId;
                if (routeId) {
                    const route = this.game.managers.route.getRouteById(routeId);
                    if (route) {
                        this.showRouteDetails(route);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }
}