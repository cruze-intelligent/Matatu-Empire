export class EventPopupUI {
    constructor(onChoice) {
        this.onChoice = onChoice;
        this.container = document.getElementById('event-popup-container');
    }

    show(event) {
        // Add event type styling
        const eventTypeClass = `event-${event.type}`;
        const eventIcon = this.getEventIcon(event.type);
        
        this.container.innerHTML = `
            <div class="modal-container event-modal">
                <div class="modal-content ${eventTypeClass}">
                    <div class="event-header">
                        <span class="event-icon">${eventIcon}</span>
                        <h2>${event.title}</h2>
                    </div>
                    <p class="event-description">${event.description}</p>
                    <div class="modal-choices">
                        ${event.choices.map((choice, index) => {
                            let choiceClass = 'choice-btn';
                            let costText = '';
                            
                            if (choice.cost) {
                                costText = ` (Ksh ${choice.cost.toLocaleString()})`;
                                choiceClass += ' choice-cost';
                            } else if (choice.bonus) {
                                costText = ` (+Ksh ${choice.bonus.toLocaleString()})`;
                                choiceClass += ' choice-bonus';
                            } else if (choice.penalty) {
                                costText = ` (${choice.penalty.toLocaleString()})`;
                                choiceClass += ' choice-penalty';
                            }

                            if (choice.successChance !== undefined) {
                                const percentage = Math.round(choice.successChance * 100);
                                costText += ` ${percentage}% chance`;
                                choiceClass += ' choice-chance';
                            }

                            return `
                                <button class="${choiceClass}" data-action='${choice.action}' data-index="${index}">
                                    <span class="choice-text">${choice.text}</span>
                                    ${costText ? `<span class="choice-cost-text">${costText}</span>` : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>
                    <div class="event-footer">
                        <small>Your choice will affect your cash, reputation, and operations.</small>
                    </div>
                    <button class="cancel-btn" style="margin-top:1rem;" onclick="window.gameInstance.components.eventPopup.hide()">Cancel</button>
                </div>
            </div>
        `;

        this.container.querySelectorAll('.choice-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                const choice = event.choices.find(c => c.action === action);
                this.onChoice(choice);
            });
        });
        
        this.container.classList.remove('hidden');
        
        // Add dramatic entrance animation
        const modal = this.container.querySelector('.modal-content');
        modal.style.transform = 'scale(0.8) translateY(-50px)';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.transition = 'all 0.3s ease-out';
            modal.style.transform = 'scale(1) translateY(0)';
            modal.style.opacity = '1';
        }, 50);
    }

    getEventIcon(type) {
        const icons = {
            'police': '🚔',
            'legal': '📋',
            'passenger': '👥',
            'operations': '⚙️',
            'positive': '✨',
            'economic': '💰',
            'opportunity': '🎯',
            'mechanical': '🔧',
            'weather': '🌦️',
            'competition': '🏁',
            'social': '🤝',
            'seasonal': '🎉'
        };
        return icons[type] || '📢';
    }

    hide() {
        const modal = this.container.querySelector('.modal-content');
        if (modal) {
            modal.style.transition = 'all 0.2s ease-in';
            modal.style.transform = 'scale(0.9) translateY(20px)';
            modal.style.opacity = '0';
            
            setTimeout(() => {
                this.container.classList.add('hidden');
            }, 200);
        } else {
            this.container.classList.add('hidden');
        }
    }
}