export class Economy {
    constructor(player) {
        this.player = player;
        this.basePassengerRate = 0.8;
        this.baseFuelConsumption = 0.6;
        this.baseConditionWear = 0.4;
    }

    calculateTick(vehicle, route, deltaTime) {
        const vehicleType = this.getVehicleType(vehicle.typeId);
        if (!vehicleType) return { profit: 0, fuelConsumed: 0, conditionWear: 0 };

        // Weather effects
        let weatherMultiplier = 1.0;
        let fuelMultiplier = 1.0;
        let breakdownMultiplier = 1.0;
        
        if (window.gameInstance && window.gameInstance.weatherManager) {
            const weatherEffects = window.gameInstance.weatherManager.getCurrentWeatherEffects();
            if (weatherEffects) {
                weatherMultiplier = weatherEffects.passengerMultiplier || 1.0;
                fuelMultiplier = weatherEffects.fuelMultiplier || 1.0;
                breakdownMultiplier = weatherEffects.breakdownChance || 1.0;
            }
        }

        const reputationBonus = 0.85 + ((this.player.reputation || 50) / 100) * 0.5;
        const levelBonus = 1 + Math.min(((this.player.level || 1) - 1) * 0.02, 0.2);
        const routeDemand = 0.7 + ((route.passengerFlow || 5) / 10) * 0.9;
        const speedBonus = 0.85 + ((vehicleType.speed || 5) / 20);
        const reliabilityBonus = 0.8 + ((vehicleType.reliability || 5) / 20);
        const distanceFit = Math.max(0.75, 1 - ((route.distance || 10) / Math.max((vehicleType.maxDistance || 100) * 2, 1)));

        // Calculate passengers
        let passengerRate = this.basePassengerRate * weatherMultiplier;
        passengerRate *= (vehicle.condition / 100);
        passengerRate *= (vehicleType.capacity / 14);
        passengerRate *= reputationBonus;
        passengerRate *= routeDemand;
        passengerRate *= speedBonus;
        passengerRate *= distanceFit;
        passengerRate *= levelBonus;
        
        const passengers = Math.min(
            Math.floor(passengerRate * deltaTime * 10),
            vehicleType.capacity
        );

        // Calculate earnings
        const farePerPassenger = (route.fare || 50) * (1 + Math.max(0, (this.player.reputation || 50) - 50) / 500);
        const revenue = passengers * farePerPassenger;
        
        // Calculate fuel consumption with route and vehicle fit.
        let fuelConsumed = this.baseFuelConsumption * fuelMultiplier * deltaTime;
        fuelConsumed *= (1 + (vehicleType.capacity / 20));
        fuelConsumed *= (1.45 - (vehicle.condition / 220));
        fuelConsumed *= (1.35 - ((vehicleType.fuelEfficiency || vehicleType.reliability || 5) / 20));
        fuelConsumed *= (1 + ((route.distance || 10) / 90));
        fuelConsumed *= (1 + ((route.risk || 3) / 30));
        
        // Calculate condition wear with route risk and reliability.
        let conditionWear = this.baseConditionWear * breakdownMultiplier * deltaTime;
        conditionWear *= (1 + Math.random() * 0.5);
        conditionWear *= (1 + ((route.risk || 3) / 12));
        conditionWear *= (1 + Math.max(0, ((route.distance || 10) - (vehicleType.maxDistance || 100) * 0.35) / 180));
        conditionWear *= (1.4 - (reliabilityBonus / 2));
        
        const driverCost = ((vehicle.driver?.salaryPerHour || 220) / 60) * deltaTime;
        const operatingCost = (revenue * (0.12 + ((route.risk || 3) / 40))) + driverCost;
        const profit = revenue - operatingCost;

        return {
            profit: Math.max(0, profit),
            fuelConsumed: Math.min(fuelConsumed, vehicle.fuel),
            conditionWear: Math.min(conditionWear, vehicle.condition),
            passengers,
            revenue,
            operatingCost
        };
    }

    getVehicleType(typeId) {
        if (window.gameInstance && window.gameInstance.vehicleManager) {
            return window.gameInstance.vehicleManager.getVehicleTypeById(typeId);
        }
        return null;
    }

    addCash(amount) {
        this.player.cash += amount;
        
        // Track total earnings (only positive amounts)
        if (amount > 0) {
            if (!this.player.totalEarningsAllTime) {
                this.player.totalEarningsAllTime = 0;
            }
            this.player.totalEarningsAllTime += amount;
        }
    }

    spendCash(amount) {
        if (this.player.cash >= amount) {
            this.player.cash -= amount;
            return true;
        }
        return false;
    }

    getPlayerState() {
        return { ...this.player };
    }

    updateDailyProfit(amount) {
        this.player.dailyProfit += amount;
    }

    adjustReputation(amount) {
        this.player.reputation = Math.max(0, Math.min(100, (this.player.reputation || 0) + amount));
        return this.player.reputation;
    }

    setReputation(value) {
        this.player.reputation = Math.max(0, Math.min(100, value));
        return this.player.reputation;
    }
}
