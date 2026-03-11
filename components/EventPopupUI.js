export class EventPopupUI {
    constructor(onChoice) {
        this.onChoice = onChoice;
        this.container = document.getElementById('event-popup-container');
        this.currentEvent = null;

        if (this.container) {
            this.container.addEventListener('click', (event) => {
                if (event.target === this.container) {
                    this.hide();
                    return;
                }

                const actionButton = event.target.closest('button[data-action]');
                if (!actionButton) return;

                if (actionButton.dataset.action === 'cancel-event') {
                    this.hide();
                    return;
                }

                if (actionButton.dataset.action === 'resolve-event' && this.currentEvent) {
                    const choice = this.currentEvent.choices[parseInt(actionButton.dataset.index, 10)];
                    if (choice) {
                        this.onChoice(choice);
                    }
                }
            });
        }
    }

    show(event) {
        if (!this.container) return;

        this.currentEvent = event;
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
                        ${event.choices.map((choice, index) => `
                            <button class="${this.getChoiceClasses(choice)}" data-action="resolve-event" data-index="${index}">
                                <span class="choice-text">${choice.text}</span>
                                <span class="choice-cost-text">${this.getChoiceMeta(choice)}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="event-footer">
                        <small>Your choice can shift cash, reputation, and route performance.</small>
                    </div>
                    <button class="cancel-btn" data-action="cancel-event">Dismiss</button>
                </div>
            </div>
        `;

        this.container.classList.remove('hidden');
        const modal = this.container.querySelector('.modal-content');
        if (!modal) return;

        modal.style.transform = 'scale(0.85) translateY(-30px)';
        modal.style.opacity = '0';

        setTimeout(() => {
            modal.style.transition = 'all 0.25s ease-out';
            modal.style.transform = 'scale(1) translateY(0)';
            modal.style.opacity = '1';
        }, 40);
    }

    hide() {
        if (!this.container) return;

        const modal = this.container.querySelector('.modal-content');
        if (!modal) {
            this.container.classList.add('hidden');
            this.currentEvent = null;
            return;
        }

        modal.style.transition = 'all 0.2s ease-in';
        modal.style.transform = 'scale(0.92) translateY(20px)';
        modal.style.opacity = '0';

        setTimeout(() => {
            this.container.classList.add('hidden');
            this.currentEvent = null;
        }, 200);
    }

    getChoiceClasses(choice) {
        const classes = ['choice-btn'];
        if (choice.cost) classes.push('choice-cost');
        if (choice.bonus) classes.push('choice-bonus');
        if (choice.penalty) classes.push('choice-penalty');
        if (choice.successChance !== undefined) classes.push('choice-chance');
        return classes.join(' ');
    }

    getChoiceMeta(choice) {
        const parts = [];
        if (choice.cost) parts.push(`Ksh ${choice.cost.toLocaleString()}`);
        if (choice.bonus) parts.push(`+Ksh ${choice.bonus.toLocaleString()}`);
        if (choice.penalty) parts.push(`-${Math.abs(choice.penalty).toLocaleString()}`);
        if (choice.successChance !== undefined) {
            parts.push(`${Math.round(choice.successChance * 100)}% success`);
        }
        return parts.join(' • ');
    }

    getEventIcon(type) {
        const icons = {
            police: '🚔',
            legal: '📋',
            passenger: '👥',
            operations: '⚙️',
            positive: '✨',
            economic: '💰',
            opportunity: '🎯',
            mechanical: '🔧',
            weather: '🌦️',
            competition: '🏁',
            social: '🤝',
            seasonal: '🎉'
        };
        return icons[type] || '📢';
    }
}
