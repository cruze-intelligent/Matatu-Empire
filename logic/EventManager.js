export class EventManager {
    constructor(game) {
        this.game = game;
        this.timeSinceLastEvent = 0;
        this.eventCheckInterval = 15; // Check for an event every 15 seconds
        this.eventChance = 0.4; // 40% chance of an event happening per check
        this.currentEvent = null;
        this.lastEventType = null;

        this.eventTemplates = [
            // Police & Legal Events
            {
                id: 'police_check',
                title: '🚔 Police Checkpoint!',
                description: 'A police officer has pulled over one of your matatus for a "routine" inspection. What do you do?',
                type: 'police',
                choices: [
                    { text: 'Bribe Officer (Ksh 2,000)', action: 'bribe', cost: 2000, successChance: 0.9, reputationChange: -2 },
                    { text: 'Wait it out legally', action: 'wait', penalty: -1000, description: "You lose time and money but maintain integrity.", reputationChange: 1 },
                    { text: 'Try to negotiate', action: 'negotiate', successChance: 0.6, alternativeCost: 500, description: "Smooth talking might work..." }
                ]
            },
            {
                id: 'license_inspection',
                title: '📋 License Inspection',
                description: 'Traffic police want to inspect your vehicle licenses and permits. Your papers are...',
                type: 'legal',
                choices: [
                    { text: 'All in order (Ksh 0)', action: 'legal', description: "Clean papers, no problem!" },
                    { text: 'Pay fine (Ksh 3,000)', action: 'fine', cost: 3000, description: "Some documents were expired." },
                    { text: 'Try to flee', action: 'flee', successChance: 0.3, penalty: -5000, reputationChange: -5, description: "Risky move!" }
                ]
            },

            // Driver & Passenger Events
            {
                id: 'drunk_passenger',
                title: '🍺 Drunk Passenger Problem',
                description: 'A heavily intoxicated passenger is causing trouble in one of your matatus. Other passengers are complaining.',
                type: 'passenger',
                choices: [
                    { text: 'Driver kicks them out', action: 'kick_out', penalty: -200, description: "Lost the fare but kept other passengers happy.", reputationChange: 2 },
                    { text: 'Let them stay', action: 'tolerate', penalty: -500, reputationChange: -3, description: "Other passengers are upset and some got off early." },
                    { text: 'Call police', action: 'police', cost: 0, description: "Professional handling of the situation.", reputationChange: 1 }
                ]
            },
            {
                id: 'driver_sick',
                title: '🤒 Driver Called in Sick',
                description: 'One of your drivers called in sick this morning. You have a matatu but no driver for the busy route.',
                type: 'operations',
                choices: [
                    { text: 'Hire temporary driver (Ksh 1,500)', action: 'temp_driver', cost: 1500, description: "Route continues with reduced efficiency." },
                    { text: 'Drive it yourself', action: 'self_drive', description: "You take the wheel for the day!", reputationChange: 3 },
                    { text: 'Park for the day', action: 'park', penalty: -2000, description: "Lost a full day of earnings." }
                ]
            },
            {
                id: 'happy_passengers',
                title: '😊 Happy Passengers',
                description: 'Passengers are praising your matatu service! Word is spreading about your reliable fleet.',
                type: 'positive',
                choices: [
                    { text: 'Thank them', action: 'thank', bonus: 500, reputationChange: 3, description: "Your reputation grows!" }
                ]
            },

            // Economic Events
            {
                id: 'fuel_hike',
                title: '⛽ Fuel Price Surge!',
                description: 'The government announced a sudden 25% fuel price increase. This affects all your operations.',
                type: 'economic',
                choices: [
                    { text: 'Increase fares temporarily', action: 'raise_fares', description: "Passengers grumble but accept it.", reputationChange: -1 },
                    { text: 'Absorb the cost', action: 'absorb', penalty: -1000, description: "Customers appreciate your stability.", reputationChange: 2 }
                ]
            },
            {
                id: 'bonus_route',
                title: '💰 Lucrative Event Route',
                description: 'There\'s a big concert downtown! Demand for transport has skyrocketed. Quick money to be made!',
                type: 'opportunity',
                choices: [
                    { text: 'Send your best matatu', action: 'send_best', bonus: 3000, description: "Ka-ching! Big earnings from the event crowd!" },
                    { text: 'Send multiple matatus', action: 'send_multiple', bonus: 5000, cost: 1000, description: "Higher earnings but fuel costs!" },
                    { text: 'Stick to regular routes', action: 'ignore', description: "Play it safe with normal operations." }
                ]
            },

            // Mechanical & Maintenance Events
            {
                id: 'breakdown_busy',
                title: '💥 Breakdown During Rush Hour',
                description: 'One of your matatus broke down during peak morning rush! Passengers are stranded and frustrated.',
                type: 'mechanical',
                choices: [
                    { text: 'Emergency repair (Ksh 4,000)', action: 'emergency_fix', cost: 4000, description: "Quick but expensive roadside fix." },
                    { text: 'Call tow truck (Ksh 2,000)', action: 'tow', cost: 2000, penalty: -1500, description: "Safer but passengers are very late.", reputationChange: -2 },
                    { text: 'Try DIY fix', action: 'diy', successChance: 0.5, penalty: -3000, description: "Might work... might make it worse!" }
                ]
            },
            {
                id: 'tire_burst',
                title: '💨 Tire Blowout',
                description: 'A tire burst on one of your matatus while carrying passengers. Everyone is safe but shaken.',
                type: 'mechanical',
                choices: [
                    { text: 'Replace immediately (Ksh 2,500)', action: 'replace', cost: 2500, description: "Back on the road quickly." },
                    { text: 'Use spare tire', action: 'spare', description: "Temporary fix, but needs proper replacement soon." },
                    { text: 'Offer passengers refund', action: 'refund', cost: 800, reputationChange: 4, description: "Passengers appreciate your honesty." }
                ]
            },

            // Weather & Environment Events
            {
                id: 'heavy_rain',
                title: '🌧️ Heavy Rainfall',
                description: 'Torrential rains have flooded several routes. Some roads are impassable.',
                type: 'weather',
                choices: [
                    { text: 'Take alternative routes', action: 'detour', penalty: -500, description: "Longer routes mean higher fuel costs." },
                    { text: 'Wait for rain to stop', action: 'wait_rain', penalty: -1200, description: "Lost hours of operation." },
                    { text: 'Risk the flooded road', action: 'risk_flood', successChance: 0.4, penalty: -3000, description: "Dangerous but might pay off..." }
                ]
            },

            // Competition Events
            {
                id: 'new_competitor',
                title: '🚌 New Competition',
                description: 'A new matatu company started operating on your most profitable route with shiny new vehicles!',
                type: 'competition',
                choices: [
                    { text: 'Lower your fares', action: 'price_war', penalty: -800, description: "Fight fire with fire!", reputationChange: 1 },
                    { text: 'Improve your service', action: 'improve', cost: 2000, reputationChange: 3, description: "Invest in better service quality." },
                    { text: 'Ignore them', action: 'ignore_comp', description: "Focus on your loyal customers." }
                ]
            },

            // Social Events
            {
                id: 'student_discount',
                title: '🎓 Students Need Help',
                description: 'University students are asking for discounted fares during exam period. They promise loyalty.',
                type: 'social',
                choices: [
                    { text: 'Give 30% discount', action: 'big_discount', penalty: -600, reputationChange: 5, description: "Students love you!" },
                    { text: 'Give 15% discount', action: 'small_discount', penalty: -300, reputationChange: 2, description: "Reasonable compromise." },
                    { text: 'No discounts', action: 'no_discount', reputationChange: -2, description: "Business is business." }
                ]
            },

            // Seasonal Events
            {
                id: 'holiday_rush',
                title: '🎄 Holiday Travel Boom',
                description: 'It\'s holiday season! Everyone is traveling to visit family. Demand is through the roof!',
                type: 'seasonal',
                choices: [
                    { text: 'Work overtime hours', action: 'overtime', bonus: 4000, description: "Drivers work extra shifts for big profits!" },
                    { text: 'Normal operations', action: 'normal', bonus: 1500, description: "Steady earnings without overworking." },
                    { text: 'Give drivers holiday bonus', action: 'bonus_drivers', cost: 1000, reputationChange: 4, description: "Happy drivers, better service!" }
                ]
            }
        ];
    }

    update(delta) {
        this.timeSinceLastEvent += delta;
        if (this.timeSinceLastEvent >= this.eventCheckInterval) {
            this.timeSinceLastEvent = 0;
            if (Math.random() < this.eventChance && !this.currentEvent) {
                this.triggerRandomEvent();
            }
        }
    }

    triggerRandomEvent() {
        // Filter out the last event type to avoid repetition
        let availableEvents = this.eventTemplates.filter(event => 
            event.type !== this.lastEventType || Math.random() < 0.3
        );
        
        // Weight events based on game state
        const gameState = this.game.economy.getPlayerState();
        const vehicles = this.game.vehicleManager.getVehicles();
        const runningVehicles = vehicles.filter(v => v.status === 'running');

        // More likely to get mechanical events if vehicles are in poor condition
        const poorConditionVehicles = vehicles.filter(v => v.condition < 30);
        if (poorConditionVehicles.length > 0) {
            availableEvents = availableEvents.concat(
                this.eventTemplates.filter(e => e.type === 'mechanical')
            );
        }

        // More positive events if reputation is high
        if (gameState.reputation > 70) {
            availableEvents = availableEvents.concat(
                this.eventTemplates.filter(e => e.type === 'positive' || e.type === 'opportunity')
            );
        }

        // More police events if reputation is low
        if (gameState.reputation < 40) {
            availableEvents = availableEvents.concat(
                this.eventTemplates.filter(e => e.type === 'police')
            );
        }

        if (availableEvents.length === 0) return;

        const eventIndex = Math.floor(Math.random() * availableEvents.length);
        this.currentEvent = { ...availableEvents[eventIndex] };
        this.lastEventType = this.currentEvent.type;

        // Personalize event with specific vehicle names
        if (runningVehicles.length > 0 && 
            (this.currentEvent.type === 'mechanical' || this.currentEvent.type === 'passenger')) {
            const randomVehicle = runningVehicles[Math.floor(Math.random() * runningVehicles.length)];
            this.currentEvent.description = this.currentEvent.description.replace(
                'one of your matatus', 
                `your "${randomVehicle.name}"`
            );
        }

        this.game.eventPopupUI.show(this.currentEvent);
        console.log("Event Triggered:", this.currentEvent.title);
    }

    resolveCurrentEvent(choice) {
        if (!this.currentEvent) return;

        const chosenOption = this.currentEvent.choices.find(c => c.action === choice.action);
        if (!chosenOption) return;

        let message = "";
        let toastType = "event";
        let paidCost = true;

        // Handle upfront costs
        if (chosenOption.cost) {
            if (this.game.economy.spendCash(chosenOption.cost)) {
                message = `You paid Ksh ${chosenOption.cost.toLocaleString()}. `;
            } else {
                message = `You couldn't afford Ksh ${chosenOption.cost.toLocaleString()}! `;
                this.game.economy.adjustReputation(-3);
                toastType = "error";
                paidCost = false;
            }
        }

        if (!paidCost) {
            message += 'Operations took a reputation hit.';
        } else if (chosenOption.successChance !== undefined) {
            const success = Math.random() < chosenOption.successChance;
            if (success) {
                if (chosenOption.bonus) {
                    this.game.economy.addCash(chosenOption.bonus);
                    message += `Earned Ksh ${chosenOption.bonus.toLocaleString()}! `;
                }
                if (chosenOption.reputationChange) {
                    this.game.economy.adjustReputation(chosenOption.reputationChange);
                    message += chosenOption.reputationChange > 0 ? 'Reputation improved! ' : 'Reputation suffered. ';
                }
                message += chosenOption.description || "It worked out!";
                toastType = "success";
            } else {
                // Apply alternative cost or penalty
                if (chosenOption.alternativeCost) {
                    this.game.economy.addCash(-chosenOption.alternativeCost);
                    message += `Failed! Cost you Ksh ${chosenOption.alternativeCost.toLocaleString()}.`;
                } else if (chosenOption.penalty) {
                    this.game.economy.addCash(chosenOption.penalty);
                    message += `Failed! Lost Ksh ${(-chosenOption.penalty).toLocaleString()}.`;
                } else {
                    message += "It didn't work out as planned.";
                }
                if (chosenOption.reputationChange) {
                    this.game.economy.adjustReputation(Math.min(0, chosenOption.reputationChange));
                }
                toastType = "error";
            }
        } else {
            if (chosenOption.penalty) {
                this.game.economy.addCash(chosenOption.penalty);
                message += `Lost Ksh ${(-chosenOption.penalty).toLocaleString()}. `;
                toastType = "error";
            }

            if (chosenOption.bonus) {
                this.game.economy.addCash(chosenOption.bonus);
                message += `Earned Ksh ${chosenOption.bonus.toLocaleString()}! `;
                toastType = "success";
            }

            if (chosenOption.reputationChange) {
                this.game.economy.adjustReputation(chosenOption.reputationChange);
                message += chosenOption.reputationChange > 0 ? 'Reputation improved! ' : 'Reputation suffered. ';
            }
            message += chosenOption.description || "";
        }

        if (this.game.progressionManager && toastType === 'success') {
            this.game.progressionManager.addXp(20, 'Handled city event', true);
        }
        
        this.game.dashboardUI.showToast(message, toastType);
        this.game.eventPopupUI.hide();
        this.currentEvent = null;
    }
}
