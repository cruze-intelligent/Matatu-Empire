export class WeatherManager {
    constructor(game) {
        this.game = game;
        this.currentWeather = 'sunny';
        this.weatherDuration = 0;
        this.nextWeatherChange = 60; // seconds
        this.alertContainer = null;
        this.weatherEffects = {
            sunny: { passengerMultiplier: 1.0, fuelMultiplier: 1.0, breakdownChance: 0.02, icon: '☀️' },
            rainy: { passengerMultiplier: 1.3, fuelMultiplier: 1.1, breakdownChance: 0.05, icon: '🌧️' },
            cloudy: { passengerMultiplier: 1.1, fuelMultiplier: 1.0, breakdownChance: 0.03, icon: '☁️' },
            foggy: { passengerMultiplier: 0.8, fuelMultiplier: 1.2, breakdownChance: 0.04, icon: '🌫️' }
        };
    }

    init() {
        this.createAlertContainer();
        this.setRandomWeather();
        console.log('✅ Weather manager initialized with weather:', this.currentWeather);
    }

    createAlertContainer() {
        // Remove existing container if it exists
        const existing = document.getElementById('weather-alerts');
        if (existing) {
            existing.remove();
        }
        
        this.alertContainer = document.createElement('div');
        this.alertContainer.id = 'weather-alerts';
        this.alertContainer.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            z-index: 1500;
            pointer-events: none;
            max-width: 300px;
        `;
        document.body.appendChild(this.alertContainer);
        console.log('✅ Weather alert container created');
    }

    update(deltaTime) {
        this.weatherDuration += deltaTime;
        
        if (this.weatherDuration >= this.nextWeatherChange) {
            this.changeWeather();
        }
    }

    changeWeather() {
        const oldWeather = this.currentWeather;
        this.setRandomWeather();
        
        if (oldWeather !== this.currentWeather) {
            console.log(`🌦️ Weather changing from ${oldWeather} to ${this.currentWeather}`);
            this.showWeatherChangePopup(oldWeather, this.currentWeather);
        }
        
        this.weatherDuration = 0;
        this.nextWeatherChange = this.getRandomDuration({ min: 45, max: 120 });
    }

    showWeatherChangePopup(oldWeather, newWeather) {
        if (!this.alertContainer) {
            console.log('Creating alert container for weather popup');
            this.createAlertContainer();
        }
        
        const weatherData = this.weatherEffects[newWeather];
        const popup = document.createElement('div');
        popup.className = 'weather-popup';
        popup.style.cssText = `
            background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(33, 150, 243, 0.8));
            color: white;
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            pointer-events: auto;
            opacity: 0;
            transform: translateX(-100%);
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        popup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.5rem;">${weatherData.icon}</span>
                <h3 style="margin: 0; font-size: 1rem;">Weather Update</h3>
            </div>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">
                Weather changed to <strong>${this.capitalizeFirst(newWeather)}</strong>
            </p>
            <div style="font-size: 0.8rem; opacity: 0.9;">
                ${this.getWeatherEffectDescription(newWeather)}
            </div>
            <div style="font-size: 0.7rem; opacity: 0.7; margin-top: 0.5rem;">
                Click to dismiss
            </div>
        `;
        
        const dismissButton = document.createElement('button');
        dismissButton.className = 'cancel-btn';
        dismissButton.style.marginTop = '1rem';
        dismissButton.textContent = 'Dismiss';
        dismissButton.addEventListener('click', (event) => {
            event.stopPropagation();
            popup.remove();
        });
        popup.appendChild(dismissButton);

        // Add click to dismiss
        popup.addEventListener('click', () => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        });
        
        this.alertContainer.appendChild(popup);
        console.log('Weather popup added to container');
        
        // Animate in
        setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateX(0)';
        }, 50);
        
        // Show toast notification as well
        if (this.game.components.dashboard) {
            this.game.components.dashboard.showToast(
                `Weather changed to ${this.capitalizeFirst(newWeather)} ${weatherData.icon}`,
                'info'
            );
        }
        
        // Auto remove after 8 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.opacity = '0';
                popup.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    if (popup.parentNode) {
                        popup.parentNode.removeChild(popup);
                    }
                }, 300);
            }
        }, 8000);
    }

    getWeatherEffectDescription(weather) {
        const effects = {
            sunny: '☀️ Perfect driving conditions! Normal operations.',
            rainy: '🌧️ More passengers need rides, but higher breakdown risk.',
            cloudy: '☁️ Slightly more passengers, normal fuel consumption.',
            foggy: '🌫️ Reduced visibility. Fewer passengers, higher fuel use.'
        };
        return effects[weather] || '';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    setRandomWeather() {
        const weathers = Object.keys(this.weatherEffects);
        // Remove current weather to ensure change
        const availableWeathers = weathers.filter(w => w !== this.currentWeather);
        this.currentWeather = availableWeathers[Math.floor(Math.random() * availableWeathers.length)];
    }

    getRandomDuration(range) {
        return range.min + Math.random() * (range.max - range.min);
    }

    getCurrentWeather() {
        return this.currentWeather;
    }

    getCurrentWeatherData() {
        return this.weatherEffects[this.currentWeather];
    }

    getCurrentWeatherEffects() {
        return this.weatherEffects[this.currentWeather];
    }
}
