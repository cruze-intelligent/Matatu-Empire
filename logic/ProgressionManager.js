export class ProgressionManager {
    constructor(game) {
        this.game = game;
        this.contractTemplates = [
            {
                id: 'earnings_push',
                title: 'Revenue Push',
                progress: snapshot => snapshot.totalEarnings,
                target: snapshot => this.roundUp(snapshot.totalEarnings + 30000, 10000),
                description: target => `Grow all-time earnings to Ksh ${target.toLocaleString()}.`,
                rewards: snapshot => ({ cash: 3200 + snapshot.level * 300, xp: 80 })
            },
            {
                id: 'purchase_run',
                title: 'Acquisition Run',
                progress: snapshot => snapshot.vehiclesPurchased,
                target: snapshot => snapshot.vehiclesPurchased + 1,
                description: target => `Reach ${target} total vehicle purchase${target === 1 ? '' : 's'}.`,
                rewards: snapshot => ({ cash: 4200, reputation: 1, xp: 100 })
            },
            {
                id: 'road_hours',
                title: 'Hours on the Road',
                progress: snapshot => snapshot.routeHours,
                target: snapshot => Math.max(1, Math.ceil(snapshot.routeHours + 0.5)),
                description: target => `Accumulate ${target.toFixed(1)} total route hour${target === 1 ? '' : 's'}.`,
                rewards: snapshot => ({ cash: 2600 + snapshot.level * 250, xp: 75 })
            },
            {
                id: 'driver_roster',
                title: 'Crew Builder',
                progress: snapshot => snapshot.driversHired,
                target: snapshot => snapshot.driversHired + 1,
                description: target => `Hire ${target} driver${target === 1 ? '' : 's'} across the empire.`,
                rewards: snapshot => ({ cash: 2500, reputation: 2, xp: 70 })
            },
            {
                id: 'dispatch_count',
                title: 'Dispatch Discipline',
                progress: snapshot => snapshot.dispatchCount,
                target: snapshot => this.roundUp(snapshot.dispatchCount + 3, 3),
                description: target => `Complete ${target} route dispatch${target === 1 ? '' : 'es'}.`,
                rewards: snapshot => ({ cash: 2200, xp: 65 })
            },
            {
                id: 'route_architect',
                title: 'Route Architect',
                progress: snapshot => snapshot.customRoutes,
                target: snapshot => snapshot.customRoutes + 1,
                description: target => `Design ${target} custom route${target === 1 ? '' : 's'}.`,
                rewards: snapshot => ({ cash: 3600 + snapshot.level * 200, xp: 90 })
            },
            {
                id: 'reputation_drive',
                title: 'Street Cred',
                progress: snapshot => snapshot.reputation,
                target: snapshot => Math.min(95, Math.max(snapshot.reputation + 5, 60)),
                description: target => `Push reputation to ${target}/100.`,
                rewards: snapshot => ({ cash: 2800, reputation: 2, xp: 70 })
            }
        ];

        this.milestones = [
            {
                id: 'fleet_2',
                title: 'Second Unit Online',
                description: 'Own 2 vehicles.',
                progress: snapshot => snapshot.totalVehicles,
                target: 2,
                rewards: { cash: 3000, xp: 90 }
            },
            {
                id: 'road_1h',
                title: 'Street Shift',
                description: 'Accumulate 1 total route hour.',
                progress: snapshot => snapshot.routeHours,
                target: 1,
                rewards: { cash: 2500, xp: 80 }
            },
            {
                id: 'drivers_2',
                title: 'Crew is Growing',
                description: 'Hire 2 drivers.',
                progress: snapshot => snapshot.driversHired,
                target: 2,
                rewards: { cash: 3500, reputation: 1, xp: 100 }
            },
            {
                id: 'earnings_100k',
                title: 'Six Figure Hustle',
                description: 'Earn Ksh 100,000 all time.',
                progress: snapshot => snapshot.totalEarnings,
                target: 100000,
                rewards: { cash: 6000, reputation: 2, xp: 150 }
            },
            {
                id: 'dispatch_20',
                title: 'Dispatch Control',
                description: 'Complete 20 dispatches.',
                progress: snapshot => snapshot.dispatchCount,
                target: 20,
                rewards: { cash: 5000, xp: 140 }
            },
            {
                id: 'fleet_4',
                title: 'Mini Fleet Established',
                description: 'Own 4 vehicles.',
                progress: snapshot => snapshot.totalVehicles,
                target: 4,
                rewards: { cash: 9000, reputation: 2, xp: 180 }
            }
        ];
    }

    initializePlayerState() {
        const player = this.getPlayer();
        if (!player) return;
        const vehicles = this.game?.vehicleManager?.getVehicles?.() || [];
        const driverCount = vehicles.filter(vehicle => vehicle.driver?.name).length;
        const validMilestoneIds = new Set(this.milestones.map(milestone => milestone.id));

        player.level = Math.max(1, player.level || 1);
        player.empireXP = Math.max(0, player.empireXP || 0);
        player.unlockedRewardIds = Array.isArray(player.unlockedRewardIds)
            ? [...new Set(player.unlockedRewardIds.filter(id => validMilestoneIds.has(id)))]
            : [];
        player.contractBatch = Math.max(1, player.contractBatch || 1);
        player.lastContractRefresh = player.lastContractRefresh || '';
        player.lastDailyRewardKey = player.lastDailyRewardKey || '';
        player.lastActiveDayKey = player.lastActiveDayKey || '';
        player.highestCash = Math.max(player.cash || 0, player.highestCash || 0);
        player.highestReputation = Math.max(player.reputation || 0, player.highestReputation || 0);
        player.progressionStats = {
            vehiclesPurchased: Math.max(
                Math.max(0, vehicles.length - 1),
                this.sanitizeNumber(player.progressionStats?.vehiclesPurchased)
            ),
            routeSeconds: this.sanitizeNumber(player.progressionStats?.routeSeconds),
            dispatchCount: this.sanitizeNumber(player.progressionStats?.dispatchCount),
            driversHired: Math.max(driverCount, this.sanitizeNumber(player.progressionStats?.driversHired)),
            fuelSpend: this.sanitizeNumber(player.progressionStats?.fuelSpend),
            repairSpend: this.sanitizeNumber(player.progressionStats?.repairSpend),
            contractsDiscarded: this.sanitizeNumber(player.progressionStats?.contractsDiscarded)
        };
        player.activeContracts = this.sanitizeContracts(player.activeContracts);
    }

    startSession() {
        this.initializePlayerState();

        const player = this.getPlayer();
        if (!player) return;

        const todayKey = this.getDayKey();
        if (player.lastActiveDayKey !== todayKey) {
            player.dailyProfit = 0;
            player.lastActiveDayKey = todayKey;

            if (player.lastDailyRewardKey !== todayKey) {
                const dailyCash = 2000 + (player.level - 1) * 500;
                this.game.economy.addCash(dailyCash);
                this.game.economy.adjustReputation(1);
                this.addXp(40, `Daily dispatch bonus: Ksh ${dailyCash.toLocaleString()}`, true);
                player.lastDailyRewardKey = todayKey;
                this.notify(`Daily dispatch bonus received: Ksh ${dailyCash.toLocaleString()} and +1 reputation.`, 'success');
            }
        }

        this.ensureContracts(false);
    }

    recordVehiclePurchase(cost = 0) {
        const stats = this.getStats();
        stats.vehiclesPurchased += 1;
        if (cost > 0) {
            this.addXp(Math.max(50, Math.round(cost / 2000)), 'Fleet investment', true);
        }
    }

    recordRouteTime(seconds) {
        const stats = this.getStats();
        if (seconds > 0) {
            stats.routeSeconds += seconds;
        }
    }

    recordDispatch() {
        const stats = this.getStats();
        stats.dispatchCount += 1;
    }

    recordDriverHire() {
        const stats = this.getStats();
        stats.driversHired += 1;
        this.addXp(45, 'Driver hired', true);
    }

    recordFuelSpend(amount) {
        const stats = this.getStats();
        stats.fuelSpend += Math.max(0, amount || 0);
    }

    recordRepairSpend(amount) {
        const stats = this.getStats();
        stats.repairSpend += Math.max(0, amount || 0);
    }

    discardContract(contractId) {
        const player = this.getPlayer();
        if (!player) return false;

        const contractIndex = player.activeContracts.findIndex(contract => contract.id === contractId);
        if (contractIndex === -1) return false;

        const [removedContract] = player.activeContracts.splice(contractIndex, 1);
        const stats = this.getStats();
        stats.contractsDiscarded += 1;
        this.game.economy.adjustReputation(-1);

        const replacement = this.createReplacementContract(
            this.getSnapshot(),
            [...player.activeContracts.map(contract => contract.templateId), removedContract.templateId]
        );
        if (replacement) {
            player.activeContracts.splice(contractIndex, 0, replacement);
        }

        this.notify(`Dropped ${removedContract.title}. Reputation -1.`, 'warning');
        return true;
    }

    evaluateProgress() {
        this.initializePlayerState();
        this.ensureContracts(false);

        const player = this.getPlayer();
        if (!player) return false;

        const snapshot = this.getSnapshot();
        const previousLevel = player.level;
        let changed = false;
        let contractsCompleted = 0;

        player.highestCash = Math.max(player.highestCash, snapshot.cash);
        player.highestReputation = Math.max(player.highestReputation, snapshot.reputation);

        this.milestones.forEach(milestone => {
            if (player.unlockedRewardIds.includes(milestone.id)) return;

            if (milestone.progress(snapshot) >= milestone.target) {
                player.unlockedRewardIds.push(milestone.id);
                this.applyRewards(milestone.rewards, milestone.title);
                this.notify(`${milestone.title} unlocked. ${this.formatRewardSummary(milestone.rewards)}`, 'success');
                changed = true;
            }
        });

        player.activeContracts.forEach(contract => {
            if (contract.claimed) return;

            const progress = this.getContractProgress(contract, snapshot);
            if (progress >= contract.target) {
                contract.claimed = true;
                contract.claimedAt = Date.now();
                this.applyRewards(contract.rewards, contract.title);
                this.notify(`Contract complete: ${contract.title}. ${this.formatRewardSummary(contract.rewards)}`, 'success');
                contractsCompleted += 1;
                changed = true;
            }
        });

        if (contractsCompleted > 0 && player.activeContracts.every(contract => contract.claimed)) {
            player.contractBatch += 1;
            this.generateContracts(snapshot);
            this.notify('New operations contracts are available.', 'info');
            changed = true;
        }

        if (player.level !== previousLevel) {
            changed = true;
        }

        return changed;
    }

    getDashboardData() {
        this.initializePlayerState();
        this.ensureContracts(false);

        const player = this.getPlayer();
        if (!player) {
            return {
                level: 1,
                totalXP: 0,
                xpIntoLevel: 0,
                xpForLevel: 1,
                nextLevelThreshold: 120,
                contracts: [],
                nextMilestone: null,
                stats: {
                    cash: 0,
                    reputation: 0,
                    totalEarnings: 0,
                    totalVehicles: 0,
                    activeVehicles: 0,
                    customRoutes: 0,
                    level: 1,
                    vehiclesPurchased: 0,
                    routeSeconds: 0,
                    routeHours: 0,
                    dispatchCount: 0,
                    driversHired: 0,
                    fuelSpend: 0,
                    repairSpend: 0,
                    contractsDiscarded: 0
                },
                trackers: [],
                contractsCompleted: 0,
                contractsTotal: 0,
                milestonesCompleted: 0,
                milestonesTotal: this.milestones.length,
                operatingSpend: 0
            };
        }

        const snapshot = this.getSnapshot();
        const currentLevelFloor = this.getXpRequiredForLevel(player.level);
        const nextLevelThreshold = this.getXpRequiredForLevel(player.level + 1);
        const xpIntoLevel = player.empireXP - currentLevelFloor;
        const xpForLevel = nextLevelThreshold - currentLevelFloor;
        const nextMilestone = this.getNextMilestone(snapshot);
        const contractsCompleted = player.activeContracts.filter(contract => contract.claimed).length;
        const contractsTotal = player.activeContracts.length;
        const milestonesCompleted = player.unlockedRewardIds.length;
        const milestonesTotal = this.milestones.length;
        const operatingSpend = snapshot.fuelSpend + snapshot.repairSpend;

        return {
            level: player.level,
            totalXP: player.empireXP,
            xpIntoLevel,
            xpForLevel,
            nextLevelThreshold,
            contracts: player.activeContracts.map(contract => {
                const progress = this.getContractProgress(contract, snapshot);
                const completion = contract.target > 0
                    ? Math.max(0, Math.min(100, Math.round((progress / contract.target) * 100)))
                    : 0;
                return {
                    ...contract,
                    progress,
                    completion
                };
            }),
            nextMilestone,
            stats: snapshot,
            contractsCompleted,
            contractsTotal,
            milestonesCompleted,
            milestonesTotal,
            operatingSpend,
            trackers: [
                {
                    id: 'purchases',
                    label: 'Fleet Purchases',
                    value: `${snapshot.vehiclesPurchased}`,
                    helper: 'Vehicles bought across the whole run'
                },
                {
                    id: 'routeHours',
                    label: 'Time on Route',
                    value: `${snapshot.routeHours.toFixed(1)} hrs`,
                    helper: 'Combined live service time from active dispatches'
                },
                {
                    id: 'dispatches',
                    label: 'Dispatches',
                    value: `${snapshot.dispatchCount}`,
                    helper: 'Completed route launches tracked for contracts'
                },
                {
                    id: 'drivers',
                    label: 'Drivers Hired',
                    value: `${snapshot.driversHired}`,
                    helper: 'Crew growth now feeds progression and operations'
                },
                {
                    id: 'operatingSpend',
                    label: 'Operating Spend',
                    value: `Ksh ${operatingSpend.toLocaleString()}`,
                    helper: `Fuel Ksh ${snapshot.fuelSpend.toLocaleString()} • Repairs Ksh ${snapshot.repairSpend.toLocaleString()}`
                },
                {
                    id: 'contractCycles',
                    label: 'Contracts Cycled',
                    value: `${snapshot.contractsDiscarded}`,
                    helper: 'Dismissed contracts used to rotate weaker offers'
                }
            ]
        };
    }

    addXp(amount, reason = 'Progress bonus', silent = false) {
        const player = this.getPlayer();
        if (!player || amount <= 0) return;

        player.empireXP += Math.round(amount);

        while (player.empireXP >= this.getXpRequiredForLevel(player.level + 1)) {
            player.level += 1;
            const levelReward = 1500 + player.level * 500;
            this.game.economy.addCash(levelReward);
            this.game.economy.adjustReputation(1);

            if (!silent) {
                this.notify(`Empire level ${player.level} reached. Ksh ${levelReward.toLocaleString()} bonus awarded.`, 'success');
            }
        }

        if (!silent && reason) {
            this.notify(`${reason} (+${Math.round(amount)} XP)`, 'info');
        }
    }

    ensureContracts(forceRefresh = false) {
        const player = this.getPlayer();
        if (!player) return;

        const todayKey = this.getDayKey();
        const desiredContractCount = Math.min(3, this.contractTemplates.length);
        const shouldRefresh = forceRefresh ||
            !Array.isArray(player.activeContracts) ||
            player.activeContracts.length === 0 ||
            player.lastContractRefresh !== todayKey;

        if (shouldRefresh) {
            player.contractBatch = player.lastContractRefresh === todayKey ? player.contractBatch : 1;
            this.generateContracts(this.getSnapshot());
            player.lastContractRefresh = todayKey;
            return;
        }

        if (player.activeContracts.length < desiredContractCount) {
            const snapshot = this.getSnapshot();
            const missingCount = desiredContractCount - player.activeContracts.length;
            const usedTemplateIds = player.activeContracts.map(contract => contract.templateId);
            const replacements = this.createContractSelection(snapshot, missingCount, usedTemplateIds);
            player.activeContracts = [...player.activeContracts, ...replacements];
        }
    }

    generateContracts(snapshot) {
        const player = this.getPlayer();
        if (!player) return;

        player.activeContracts = this.createContractSelection(snapshot, 3);
    }

    createContractSelection(snapshot, count, excludeTemplateIds = []) {
        const availableContracts = this.contractTemplates
            .filter(template => !excludeTemplateIds.includes(template.id))
            .map(template => this.instantiateContract(template, snapshot))
            .filter(Boolean);

        return this.shuffle(availableContracts).slice(0, Math.min(count, availableContracts.length));
    }

    createReplacementContract(snapshot, excludeTemplateIds = []) {
        const [replacement] = this.createContractSelection(snapshot, 1, excludeTemplateIds);
        return replacement || null;
    }

    instantiateContract(template, snapshot) {
        const player = this.getPlayer();
        if (!player) return null;

        const target = template.target(snapshot);
        const progress = template.progress(snapshot);
        if (target <= progress) return null;

        return {
            id: `${template.id}-${player.contractBatch}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            templateId: template.id,
            title: template.title,
            description: template.description(target),
            target,
            rewards: template.rewards(snapshot),
            claimed: false
        };
    }

    getContractProgress(contract, snapshot = this.getSnapshot()) {
        const template = this.contractTemplates.find(entry => entry.id === contract.templateId);
        if (!template) return 0;
        return template.progress(snapshot);
    }

    getNextMilestone(snapshot) {
        const player = this.getPlayer();
        if (!player) return null;

        const upcoming = this.milestones.find(milestone => !player.unlockedRewardIds.includes(milestone.id));
        if (!upcoming) return null;

        const progress = Math.min(upcoming.target, upcoming.progress(snapshot));
        return {
            ...upcoming,
            progress,
            completion: upcoming.target > 0
                ? Math.max(0, Math.min(100, Math.round((progress / upcoming.target) * 100)))
                : 0
        };
    }

    applyRewards(rewards, label) {
        if (rewards.cash) {
            this.game.economy.addCash(rewards.cash);
        }
        if (rewards.reputation) {
            this.game.economy.adjustReputation(rewards.reputation);
        }
        if (rewards.xp) {
            this.addXp(rewards.xp, `${label} bonus`, true);
        }
    }

    formatRewardSummary(rewards) {
        const parts = [];
        if (rewards.cash) parts.push(`+Ksh ${rewards.cash.toLocaleString()}`);
        if (rewards.reputation) parts.push(`+${rewards.reputation} reputation`);
        if (rewards.xp) parts.push(`+${rewards.xp} XP`);
        return parts.join(' • ');
    }

    getXpRequiredForLevel(level) {
        if (level <= 1) return 0;

        let total = 0;
        for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
            total += 120 + ((currentLevel - 1) * 60);
        }
        return total;
    }

    getSnapshot() {
        const player = this.game.economy.getPlayerState();
        const vehicles = this.game.vehicleManager.getVehicles();
        const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'running').length;
        const customRoutes = this.game.routeManager.getCustomRoutes().length;
        const stats = this.getStats();

        return {
            cash: player.cash || 0,
            reputation: player.reputation || 0,
            totalEarnings: player.totalEarningsAllTime || 0,
            totalVehicles: vehicles.length,
            activeVehicles,
            customRoutes,
            level: player.level || 1,
            vehiclesPurchased: stats.vehiclesPurchased || 0,
            routeSeconds: stats.routeSeconds || 0,
            routeHours: this.secondsToHours(stats.routeSeconds || 0),
            dispatchCount: stats.dispatchCount || 0,
            driversHired: stats.driversHired || 0,
            fuelSpend: stats.fuelSpend || 0,
            repairSpend: stats.repairSpend || 0,
            contractsDiscarded: stats.contractsDiscarded || 0
        };
    }

    getPlayer() {
        return this.game?.economy?.player || this.game?.gameState?.player || null;
    }

    getStats() {
        const player = this.getPlayer();
        if (!player) return {};
        player.progressionStats = player.progressionStats || {};
        return player.progressionStats;
    }

    sanitizeContracts(contracts = []) {
        if (!Array.isArray(contracts)) return [];

        const seenIds = new Set();
        return contracts
            .map(contract => this.sanitizeContract(contract))
            .filter(contract => {
                if (!contract || seenIds.has(contract.id)) return false;
                seenIds.add(contract.id);
                return true;
            });
    }

    sanitizeContract(contract) {
        if (!contract || typeof contract !== 'object') return null;

        const template = this.contractTemplates.find(entry => entry.id === contract.templateId);
        if (!template) return null;

        const snapshot = this.getSnapshot();
        const fallbackTarget = Math.max(1, this.sanitizeNumber(template.target(snapshot), 1));
        const target = Math.max(1, this.sanitizeNumber(contract.target, fallbackTarget));

        return {
            id: typeof contract.id === 'string' && contract.id.trim()
                ? contract.id
                : `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            templateId: template.id,
            title: typeof contract.title === 'string' && contract.title.trim()
                ? contract.title
                : template.title,
            description: typeof contract.description === 'string' && contract.description.trim()
                ? contract.description
                : template.description(target),
            target,
            rewards: this.sanitizeRewards(contract.rewards, template.rewards(snapshot)),
            claimed: Boolean(contract.claimed),
            claimedAt: Number.isFinite(contract.claimedAt) ? contract.claimedAt : null
        };
    }

    sanitizeRewards(rewards, fallbackRewards = {}) {
        const source = rewards && typeof rewards === 'object' ? rewards : fallbackRewards;
        return {
            cash: Math.round(this.sanitizeNumber(source.cash)),
            reputation: Math.round(this.sanitizeNumber(source.reputation)),
            xp: Math.round(this.sanitizeNumber(source.xp))
        };
    }

    sanitizeNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
    }

    secondsToHours(seconds) {
        return Math.round((seconds / 3600) * 10) / 10;
    }

    getDayKey() {
        return new Date().toLocaleDateString('en-CA');
    }

    roundUp(value, increment) {
        return Math.ceil(value / increment) * increment;
    }

    shuffle(items) {
        const clone = [...items];
        for (let index = clone.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
        }
        return clone;
    }

    notify(message, type = 'info') {
        if (this.game?.components?.dashboard?.showToast) {
            this.game.components.dashboard.showToast(message, type);
        }
    }
}
