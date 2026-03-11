// Add this function at the top of the file before the Game class

function setupOrientationHandling() {
    function checkOrientation() {
        const orientationLock = document.getElementById('orientation-lock');
        const gameContainer = document.getElementById('game-container');
        
        if (!orientationLock || !gameContainer) return;
        
        const isMobile = window.innerWidth <= 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isMobile && isPortrait) {
            orientationLock.style.display = 'flex';
            gameContainer.style.display = 'none';
            document.body.classList.add('mobile-portrait');
        } else {
            orientationLock.style.display = 'none';
            gameContainer.style.display = 'grid';
            document.body.classList.remove('mobile-portrait');
        }
    }
    
    // Check immediately
    checkOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(checkOrientation, 100);
    });
    
    // Listen for resize events
    window.addEventListener('resize', checkOrientation);
    
    // Check when page visibility changes (for better mobile support)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(checkOrientation, 100);
        }
    });
}

import { RouteManager } from './logic/RouteManager.js';
import { VehicleManager } from './logic/VehicleManager.js';
import { Economy } from './logic/Economy.js';
import { WeatherManager } from './logic/WeatherManager.js';
import { EventManager } from './logic/EventManager.js';
import { DashboardUI } from './components/DashboardUI.js';
import { MapUI } from './components/MapUI.js';
import { EventPopupUI } from './components/EventPopupUI.js';
import { DriverMessages } from './components/DriverMessages.js';
import { WelcomeModal } from './components/WelcomeModal.js';
import { ProgressionManager } from './logic/ProgressionManager.js';

class Game {
    constructor() {
        this.gameState = {
            player: {
                cash: 50000,
                reputation: 50,
                dailyProfit: 0,
                totalEarningsAllTime: 0,
                businessStartDate: Date.now(),
                level: 1,
                empireXP: 0,
                unlockedRewardIds: [],
                activeContracts: [],
                contractBatch: 1,
                progressionStats: {
                    vehiclesPurchased: 0,
                    routeSeconds: 0,
                    dispatchCount: 0,
                    driversHired: 0,
                    fuelSpend: 0,
                    repairSpend: 0,
                    contractsDiscarded: 0
                }
            },
            vehicles: [],
            nextVehicleId: 1,
            customRoutes: [],
            gameTime: 0,
            isPaused: false,
            lastSave: Date.now()
        };
        
        this.managers = {};
        this.components = {};
        this.isInitialized = false;
        this.lastTime = 0;
        this.deferredInstallPrompt = null;
        this.installButton = null;
        this.pwaSetupDone = false;
    }

    async init() {
        try {
            console.log('🎮 Initializing Matatu Empire...');
            
            // Wait for DOM to be fully ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }
            
            // Initialize managers first
            await this.initializeManagers();
            
            // Check for saved game BEFORE initializing components
            const hasExistingGame = this.loadGame();
            
            // Wait a bit more for routes to load completely
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Initialize components after managers are ready
            this.initializeComponents();
            this.setupEventListeners();
            this.setupPWA();
            this.startGameSystems();
            
            console.log('✅ Game initialization complete!');
            
            // Show welcome modal with appropriate content
            setTimeout(() => {
                if (this.components.welcomeModal) {
                    this.components.welcomeModal.show(!hasExistingGame);
                }
            }, 300);
            
            this.isInitialized = true;
            
            // Make game instance globally available for debugging
            window.gameInstance = this;
            
            // Force initial dashboard update
            setTimeout(() => {
                if (this.components.dashboard) {
                    this.components.dashboard.update();
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeManagers() {
        console.log('🔧 Initializing managers...');
        
        this.managers.route = new RouteManager();
        this.managers.vehicle = new VehicleManager();
        this.managers.economy = new Economy(this.gameState.player);
        this.managers.weather = new WeatherManager(this);
        this.managers.event = new EventManager(this);
        this.managers.progression = new ProgressionManager(this);
        
        // Wait for async loading to complete
        await Promise.all([
            this.managers.route.loadRoutes(),
            this.managers.vehicle.loadVehicleTypes()
        ]);
        
        console.log('✅ Managers initialized');
        console.log('Routes available:', this.getAllRoutes().length);
        console.log('Vehicle types available:', this.managers.vehicle.getVehicleTypes().length);
    }

    initializeComponents() {
        console.log('🎨 Initializing UI components...');
        
        try {
            // Initialize dashboard first
            this.components.dashboard = new DashboardUI(this);
            
            // Initialize welcome modal
            this.components.welcomeModal = new WelcomeModal(this);
            
            // Get all routes safely
            const allRoutes = this.getAllRoutes();
            console.log('Available routes for map:', allRoutes.length);
            
            // Initialize map with proper error handling
            this.components.map = new MapUI(
                allRoutes,
                this.managers.vehicle,
                (routeId) => {
                    try {
                        const route = this.managers.route.getRouteById(routeId);
                        if (route && this.components.dashboard) {
                            this.components.dashboard.showRouteDetails(route);
                        }
                    } catch (error) {
                        console.error('Error showing route details:', error);
                    }
                }
            );
            
            // Initialize other components
            this.components.eventPopup = new EventPopupUI((choice) => {
                if (this.managers.event) {
                    this.managers.event.resolveCurrentEvent(choice);
                }
            });
            
            this.components.driverMessages = new DriverMessages(this);
            
            console.log('✅ UI components initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing components:', error);
            throw error; // Re-throw to be caught by main init
        }
    }

    setupEventListeners() {
        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleRuntimeError(e.error);
        });
        
        console.log('✅ Event listeners setup');
    }

    setupPWA() {
        if (this.pwaSetupDone) {
            this.updateInstallButtonState();
            return;
        }

        this.pwaSetupDone = true;
        this.installButton = document.getElementById('install-app');

        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.promptInstall());
        }

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredInstallPrompt = event;
            this.updateInstallButtonState();
            this.components.dashboard?.showToast('Install is ready from the control bar.', 'info');
        });

        window.addEventListener('appinstalled', () => {
            this.deferredInstallPrompt = null;
            this.updateInstallButtonState();
            this.components.dashboard?.showToast('Matatu Empire installed successfully.', 'success');
        });

        const standaloneMedia = window.matchMedia('(display-mode: standalone)');
        const updateInstallState = () => this.updateInstallButtonState();
        if (typeof standaloneMedia.addEventListener === 'function') {
            standaloneMedia.addEventListener('change', updateInstallState);
        } else if (typeof standaloneMedia.addListener === 'function') {
            standaloneMedia.addListener(updateInstallState);
        }

        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('✅ Service worker registered'))
                .catch(error => console.error('Service worker registration failed:', error));
        }

        this.updateInstallButtonState();
    }

    updateInstallButtonState() {
        this.installButton = this.installButton || document.getElementById('install-app');
        if (!this.installButton) return;

        this.installButton.classList.remove('hidden', 'is-installed');
        this.installButton.disabled = false;

        if (this.isStandaloneDisplay()) {
            this.installButton.textContent = '✅ Installed';
            this.installButton.disabled = true;
            this.installButton.classList.add('is-installed');
            return;
        }

        if (this.deferredInstallPrompt) {
            this.installButton.textContent = '⬇️ Install';
            return;
        }

        if (this.isAppleMobile()) {
            this.installButton.textContent = '📲 Add to Home';
            return;
        }

        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            this.installButton.textContent = '🧭 Install Help';
            return;
        }

        this.installButton.classList.add('hidden');
    }

    isStandaloneDisplay() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    isAppleMobile() {
        const platform = navigator.platform || '';
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    async promptInstall() {
        if (this.isStandaloneDisplay()) {
            this.components.dashboard?.showToast('Matatu Empire is already installed on this device.', 'info');
            return;
        }

        if (this.deferredInstallPrompt) {
            const installPrompt = this.deferredInstallPrompt;
            this.deferredInstallPrompt = null;

            try {
                await installPrompt.prompt();
                await installPrompt.userChoice;
            } catch (error) {
                console.error('Install prompt failed:', error);
            }

            this.updateInstallButtonState();
            return;
        }

        this.showInstallGuide();
    }

    showInstallGuide() {
        const dashboard = this.components.dashboard;
        if (!dashboard?.createModal) {
            this.components.dashboard?.showToast('Use your browser menu to install or add the app to your home screen.', 'info');
            return;
        }

        const { title, description, steps, note } = this.getInstallGuide();
        const modal = dashboard.createModal(`
            <div class="install-modal-content glass-card">
                <h3>${title}</h3>
                <p>${description}</p>
                <ol class="install-steps">
                    ${steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
                <p class="install-note">${note}</p>
                <div class="modal-actions">
                    <button class="cancel-btn" data-action="close-modal">Close</button>
                </div>
            </div>
        `, 'install-modal');

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-action="close-modal"]')) {
                modal.remove();
            }
        });
    }

    getInstallGuide() {
        if (this.isAppleMobile()) {
            return {
                title: 'Add Matatu Empire to Home Screen',
                description: 'iPhone and iPad install flows are manual, but the game is now configured for full-screen launch and offline caching.',
                steps: [
                    'Open the Share menu in Safari.',
                    'Choose "Add to Home Screen".',
                    'Confirm the title, then tap "Add".'
                ],
                note: 'Launching from the home screen gives you the closest native-app experience on iOS.'
            };
        }

        return {
            title: 'Install Matatu Empire',
            description: 'Your browser can install this game as a standalone app with offline support after the first visit.',
            steps: [
                'Open the browser menu or address bar install control.',
                'Choose "Install App" or "Add to Home Screen".',
                'Confirm the install prompt to pin the game on this device.'
            ],
            note: 'If the install prompt is not visible yet, reload once after the service worker finishes caching the game shell.'
        };
    }

    startGameSystems() {
        if (this.managers.weather) {
            this.managers.weather.init();
        }

        if (this.managers.progression) {
            this.managers.progression.startSession();
        }

        // Start game loop
        this.startGameLoop();
        
        // Start autosave
        setInterval(() => this.saveGame(), 30000);
        
        console.log('🚀 Game systems started');
    }

    // Game state management
    getAllRoutes() {
        const standardRoutes = this.managers.route.getStandardRoutes() || [];
        const customRoutes = this.managers.route.getCustomRoutes() || [];
        return [...standardRoutes, ...customRoutes];
    }

    get vehicleManager() { return this.managers.vehicle; }
    get routeManager() { return this.managers.route; }
    get economy() { return this.managers.economy; }
    get weatherManager() { return this.managers.weather; }
    get eventManager() { return this.managers.event; }
    get progressionManager() { return this.managers.progression; }
    get dashboardUI() { return this.components.dashboard; }
    get driverMessages() { return this.components.driverMessages; }
    get eventPopupUI() { return this.components.eventPopup; }

    // Game loop
    startGameLoop() {
        this.lastTime = performance.now();
        this.runGameLoop();
    }

    runGameLoop() {
        try {
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            this.update(deltaTime);
        } catch (error) {
            console.error('Game loop error:', error);
        }
        
        requestAnimationFrame(() => this.runGameLoop());
    }

    update(delta) {
        if (!this.gameState || !this.isInitialized) return;
        
        // Throttle updates to prevent performance issues
        if ((this.gameState.gameTime += delta) < 1) return;
        this.gameState.gameTime = 0;

        try {
            const vehicles = this.managers.vehicle.getVehicles();
            let hasUpdates = false;
            let runningVehicles = 0;
            
            vehicles.forEach(vehicle => {
                if (vehicle.status === 'running' && vehicle.routeId) {
                    runningVehicles += 1;
                    const route = this.managers.route.getRouteById(vehicle.routeId);
                    if (route) {
                        const { profit, fuelConsumed, conditionWear } = this.managers.economy.calculateTick(vehicle, route, 1);
                        
                        const updatedVehicle = this.managers.vehicle.updateVehicleState(vehicle.id, -fuelConsumed, -conditionWear, profit);
                        
                        if (updatedVehicle && updatedVehicle.status === 'running') {
                            this.managers.economy.addCash(profit);
                            this.managers.economy.updateDailyProfit(profit);
                            if (this.managers.progression && profit > 0) {
                                this.managers.progression.addXp(Math.max(4, Math.round(profit / 80)), '', true);
                            }
                            hasUpdates = true;
                        } else if (updatedVehicle && updatedVehicle.status !== 'running') {
                            // Handle breakdown
                            if (this.components.driverMessages) {
                                this.components.driverMessages.showMessage(
                                    updatedVehicle.name,
                                    `Vehicle ${updatedVehicle.status === 'breakdown' ? 'broke down' : 'ran out of fuel'}! Need immediate attention.`,
                                    'error'
                                );
                            }
                            hasUpdates = true;
                        }
                    }
                }
            });

            if (this.managers.progression && runningVehicles > 0) {
                this.managers.progression.recordRouteTime(runningVehicles);
            }
            
            // Update systems
            if (this.managers.weather) {
                this.managers.weather.update(delta);
            }
            
            if (this.managers.event) {
                this.managers.event.update(delta);
            }
            
            // Only update UI if there were actual changes
            if (hasUpdates) {
                if (this.components.dashboard) {
                    const progressionChanged = this.managers.progression ? this.managers.progression.evaluateProgress() : false;
                    if (progressionChanged) {
                        this.components.dashboard.update();
                    } else {
                        this.components.dashboard.refreshLiveData();
                    }
                }
            } else if (runningVehicles > 0 && this.components.dashboard) {
                this.components.dashboard.refreshLiveData();
            }
            
            // Always update map and driver messages (they have their own throttling)
            if (this.components.map) {
                this.components.map.updateVehiclePositions();
            }
            
            if (this.components.driverMessages) {
                this.components.driverMessages.update();
            }
        } catch (error) {
            console.error('Error in game update loop:', error);
        }
    }

    assignVehicleToRoute(vehicleId, routeId) {
        try {
            const vehicle = this.managers.vehicle.getVehicleById(vehicleId);
            const route = this.managers.route.getRouteById(routeId);
            const vehicleType = vehicle ? this.managers.vehicle.getVehicleType(vehicle.typeId) : null;
            
            if (!vehicle || !route || !vehicleType) {
                console.error('Vehicle or route not found');
                return;
            }

            if ((vehicleType.maxDistance || 100) < route.distance) {
                this.components.dashboard?.showToast(`${vehicle.name} cannot handle ${route.distance} km routes.`, 'error');
                return;
            }

            if (!vehicle.driver?.name) {
                this.components.dashboard?.showToast(`${vehicle.name} needs a hired driver before dispatch.`, 'warning');
                return;
            }

            if (vehicle.fuel <= 10) {
                this.components.dashboard?.showToast(`${vehicle.name} needs refueling before dispatch.`, 'warning');
                return;
            }

            if (vehicle.condition <= 25 || vehicle.status === 'breakdown') {
                this.components.dashboard?.showToast(`${vehicle.name} needs repairs before dispatch.`, 'warning');
                return;
            }

            if (vehicle.routeId && vehicle.routeId !== routeId) {
                this.unassignVehicleFromRoute(vehicle.id, vehicle.routeId, true);
            }
            
            // Update vehicle
            vehicle.routeId = routeId;
            vehicle.status = 'running';
            
            // Update route
            this.managers.route.assignVehicleToRoute(vehicleId, routeId);

            if (this.managers.progression) {
                this.managers.progression.recordDispatch();
            }
            
            if (this.components.dashboard) {
                this.components.dashboard.showToast(`${vehicle.name} assigned to ${route.name}`, 'success');
                this.components.dashboard.update();
            }

            if (this.components.map) {
                this.components.map.updateVehiclePositions();
            }
            
            console.log(`✅ Vehicle ${vehicleId} assigned to route ${routeId}`);
        } catch (error) {
            console.error('Error assigning vehicle:', error);
        }
    }

    unassignVehicleFromRoute(vehicleId, routeId, silent = false) {
        try {
            const vehicle = this.managers.vehicle.getVehicleById(vehicleId);
            
            if (!vehicle) {
                console.error('Vehicle not found');
                return;
            }
            
            // Update vehicle
            vehicle.routeId = null;
            if (vehicle.status === 'running') {
                vehicle.status = 'idle';
            }
            
            // Update route
            this.managers.route.unassignVehicleFromRoute(vehicleId, routeId);
            
            if (this.components.dashboard && !silent) {
                this.components.dashboard.showToast(`${vehicle.name} unassigned from route`, 'info');
                this.components.dashboard.update();
            }

            if (this.components.map) {
                this.components.map.updateVehiclePositions();
            }
            
            console.log(`✅ Vehicle ${vehicleId} unassigned from route`);
        } catch (error) {
            console.error('Error unassigning vehicle:', error);
        }
    }

    // Save/Load system
    saveGame() {
        if (!this.managers.economy) return;
        
        const gameData = {
            player: this.managers.economy.getPlayerState(),
            vehicles: this.managers.vehicle.getVehicles(),
            nextVehicleId: this.managers.vehicle.getNextVehicleId(),
            customRoutes: this.managers.route.getCustomRoutes(),
            currentWeather: this.managers.weather ? this.managers.weather.getCurrentWeather() : 'sunny',
            timestamp: Date.now()
        };
        
        localStorage.setItem('matatuEmpireGameState', JSON.stringify(gameData));
        
        if (this.components.dashboard) {
            this.components.dashboard.showToast('Game saved successfully!', 'success');
        }
        
        console.log('Game saved:', gameData);
    }

    loadGame() {
        try {
            const savedData = localStorage.getItem('matatuEmpireGameState');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Load player state
                this.gameState.player = {
                    cash: data.player?.cash || 50000,
                    reputation: data.player?.reputation || 50,
                    dailyProfit: data.player?.dailyProfit || 0,
                    totalEarningsAllTime: data.player?.totalEarningsAllTime || 0,
                    businessStartDate: data.player?.businessStartDate || Date.now(),
                    level: data.player?.level || 1,
                    empireXP: data.player?.empireXP || 0,
                    unlockedRewardIds: data.player?.unlockedRewardIds || [],
                    activeContracts: data.player?.activeContracts || [],
                    contractBatch: data.player?.contractBatch || 1,
                    lastContractRefresh: data.player?.lastContractRefresh || '',
                    lastDailyRewardKey: data.player?.lastDailyRewardKey || '',
                    lastActiveDayKey: data.player?.lastActiveDayKey || '',
                    highestCash: data.player?.highestCash || 0,
                    highestReputation: data.player?.highestReputation || 50,
                    progressionStats: data.player?.progressionStats || {
                        vehiclesPurchased: 0,
                        routeSeconds: 0,
                        dispatchCount: 0,
                        driversHired: 0,
                        fuelSpend: 0,
                        repairSpend: 0,
                        contractsDiscarded: 0
                    }
                };
                
                // Load vehicles and ensure they have nicknames
                this.gameState.vehicles = (data.vehicles || []).map(vehicle => {
                    if (!vehicle.nickname) {
                        vehicle.nickname = this.generateDefaultNickname(vehicle.name);
                    }
                    return vehicle;
                });
                
                this.gameState.nextVehicleId = data.nextVehicleId || 1;
                this.gameState.customRoutes = data.customRoutes || [];
                
                // Update managers
                this.managers.economy.player = this.gameState.player;
                this.managers.vehicle.initializeVehicles(this.gameState.vehicles);
                this.managers.vehicle.nextVehicleId = this.gameState.nextVehicleId;
                this.managers.route.initializeCustomRoutes(this.gameState.customRoutes);
                this.managers.progression?.initializePlayerState();
                
                console.log('Game loaded successfully with vehicle nicknames:', {
                    cash: this.gameState.player.cash,
                    vehicles: this.gameState.vehicles.length,
                    customRoutes: this.gameState.customRoutes.length
                });
                
                return true;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        
        this.initNewGame();
        return false;
    }

    initNewGame() {
        console.log("🆕 Initializing a new game...");
        
        // Reset game state
        this.gameState = {
            player: {
                cash: 50000,
                reputation: 50,
                dailyProfit: 0,
                totalEarningsAllTime: 0,
                businessStartDate: Date.now(),
                level: 1,
                empireXP: 0,
                unlockedRewardIds: [],
                activeContracts: [],
                contractBatch: 1,
                progressionStats: {
                    vehiclesPurchased: 0,
                    routeSeconds: 0,
                    dispatchCount: 0,
                    driversHired: 1,
                    fuelSpend: 0,
                    repairSpend: 0,
                    contractsDiscarded: 0
                }
            },
            vehicles: [],
            nextVehicleId: 1,
            customRoutes: [],
            gameTime: 0,
        };
        
        // Start with one basic matatu with nickname
        const startingVehicle = {
            id: this.gameState.nextVehicleId++,
            typeId: "matatu_old",
            name: "Old Reliable",
            nickname: "OR", // Default nickname
            fuel: 100,
            condition: 80,
            routeId: null,
            status: 'idle',
            passengers: 0,
            totalEarnings: 0,
            driver: this.managers.vehicle?.createDriverProfile('Old Reliable', {
                name: 'Amani Okello',
                experience: 4,
                salaryPerHour: 260
            }) || null
        };
        
        this.gameState.vehicles.push(startingVehicle);
        
        // Update managers with new game data
        if (this.managers.economy) {
            this.managers.economy.player = this.gameState.player;
        }
        
        if (this.managers.vehicle) {
            this.managers.vehicle.initializeVehicles(this.gameState.vehicles);
            this.managers.vehicle.nextVehicleId = this.gameState.nextVehicleId;
        }
        
        if (this.managers.route) {
            this.managers.route.initializeCustomRoutes(this.gameState.customRoutes);
        }

        if (this.managers.progression) {
            this.managers.progression.initializePlayerState();
        }
        
        console.log("✅ New game initialized with starting vehicle:", startingVehicle);
    }

    resetGame() {
        if (confirm('Are you sure you want to reset your game? This will delete all progress!')) {
            localStorage.removeItem('matatuEmpireGameState');
            window.location.reload();
        }
    }

    handleInitializationError(error) {
        console.error('Game initialization failed:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 9999;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Game Failed to Load</h3>
            <p>Please refresh the page and try again.</p>
            <p>Error: ${error.message}</p>
        `;
        document.body.appendChild(errorDiv);
    }

    handleRuntimeError(error) {
        console.error('Runtime error handled:', error);
        if (this.components.dashboard) {
            this.components.dashboard.showToast('An error occurred. Game auto-saving...', 'error');
            setTimeout(() => this.saveGame(), 1000);
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

    debugUIState() {
        console.log('🔍 UI Debug Info:');
        console.log('Dashboard container:', this.components.dashboard?.dashboardContainer);
        console.log('Fleet container:', this.components.dashboard?.fleetContainer);
        console.log('Route details container:', this.components.dashboard?.routeDetailsContainer);
        console.log('Vehicles:', this.managers.vehicle?.getVehicles()?.length);
        console.log('Routes:', this.getAllRoutes()?.length);
        console.log('Game initialized:', this.isInitialized);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Setup orientation handling first
    setupOrientationHandling();
    
    // Then initialize the game
    const game = new Game();
    game.init();
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    if (window.gameInstance && window.gameInstance.isInitialized) {
        e.preventDefault();
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
    }
});
