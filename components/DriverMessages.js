export class DriverMessages {
    constructor(game) {
        this.game = game;
        this.messageContainer = this.createMessageContainer();
        this.messages = [];
        this.lastMessageTime = 0;
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'driver-messages';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 300px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1500;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    showMessage(vehicleName, message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `driver-message driver-message-${type}`;
        messageEl.style.cssText = `
            background: linear-gradient(135deg, var(--bg-dark), var(--bg-light));
            border: 2px solid var(--primary-color);
            border-radius: 8px;
            padding: 0.8rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
        `;

        messageEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                <span style="font-size: 1.2rem;">📻</span>
                <strong>${vehicleName}</strong>
            </div>
            <div style="margin-left: 1.7rem; color: var(--text-secondary);">
                "${message}"
            </div>
        `;

        this.messageContainer.appendChild(messageEl);

        // Animate in
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 6 seconds
        setTimeout(() => {
            messageEl.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }, 6000);

        // Keep only last 3 messages visible
        const messages = this.messageContainer.children;
        if (messages.length > 3) {
            messages[0].remove();
        }
    }

    update() {
        const now = performance.now();
        if (now - this.lastMessageTime < 10000) return; // Max one message per 10 seconds

        const vehicles = this.game.vehicleManager.getVehicles();
        const runningVehicles = vehicles.filter(v => v.status === 'running');

        if (runningVehicles.length === 0) return;

        // Random chance for a driver message
        if (Math.random() < 0.1) { // 10% chance per update cycle
            const vehicle = runningVehicles[Math.floor(Math.random() * runningVehicles.length)];
            const route = this.game.routeManager.getRouteById(vehicle.routeId);
            
            const message = this.generateRandomMessage(vehicle, route);
            if (message) {
                this.showMessage(vehicle.driver?.name || vehicle.name, message.text, message.type);
                this.lastMessageTime = now;
            }
        }
    }

    generateRandomMessage(vehicle, route) {
        const messages = [
            // General operation messages
            { text: "Traffic is moving smoothly today, boss!", type: 'info', condition: () => true },
            { text: "Passengers are happy with our service!", type: 'positive', condition: () => vehicle.condition > 70 },
            { text: "Route is busy, making good money today!", type: 'positive', condition: () => route && route.passengerFlow > 7 },
            
            // Vehicle condition messages
            { text: "This matatu is running like a dream!", type: 'positive', condition: () => vehicle.condition > 85 },
            { text: "Engine sounds a bit rough, might need checking soon.", type: 'warning', condition: () => vehicle.condition < 50 },
            { text: "Brakes feel spongy, boss. Better get them checked.", type: 'warning', condition: () => vehicle.condition < 30 },
            
            // Fuel messages
            { text: "Fuel gauge is getting low, will need to refuel soon.", type: 'warning', condition: () => vehicle.fuel < 25 },
            { text: "Just filled up the tank, ready for long hours!", type: 'positive', condition: () => vehicle.fuel > 90 },
            
            // Passenger interactions
            { text: "Had a really grateful passenger today, gave me a tip!", type: 'positive', condition: () => Math.random() < 0.3 },
            { text: "Some passengers complained about the music volume.", type: 'info', condition: () => vehicle.typeId === 'matatu_sound' },
            { text: "University students love this route!", type: 'positive', condition: () => route && route.name.includes('Uni') },
            
            // Route-specific messages
            { text: "CBD route is always packed with business people.", type: 'info', condition: () => route && route.name.includes('CBD') },
            { text: "Airport run pays well, but traffic can be crazy!", type: 'info', condition: () => route && route.name.includes('Airport') },
            { text: "Industrial area workers are the most reliable passengers.", type: 'positive', condition: () => route && route.name.includes('Industrial') },
            
            // Weather and road conditions
            { text: "Roads are clear today, making good time!", type: 'positive', condition: () => Math.random() < 0.2 },
            { text: "Pothole on the main road, had to take a detour.", type: 'warning', condition: () => Math.random() < 0.1 },
            
            // Competition messages
            { text: "Saw some new matatus on our route today.", type: 'info', condition: () => Math.random() < 0.15 },
            { text: "Our regular passengers chose us over the competition!", type: 'positive', condition: () => this.game.economy.getPlayerState().reputation > 60 },
            
            // Time-based messages
            { text: "Morning rush hour is crazy but profitable!", type: 'info', condition: () => this.isRushHour() },
            { text: "Quiet afternoon, perfect time for maintenance.", type: 'info', condition: () => !this.isRushHour() },
        ];

        const validMessages = messages.filter(msg => msg.condition());
        if (validMessages.length === 0) return null;

        return validMessages[Math.floor(Math.random() * validMessages.length)];
    }

    isRushHour() {
        const hour = new Date().getHours();
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    }
}
