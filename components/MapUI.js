export class MapUI {
    constructor(routes, vehicleManager, onRouteClick) {
        this.routes = routes || [];
        this.vehicleManager = vehicleManager;
        this.onRouteClick = onRouteClick;
        this.mapContainer = document.getElementById('map-container');
        this.routeCreationMode = false;
        this.routeDeletionMode = false;
        this.selectedPoints = [];
        this.cityPoints = this.generateCityPoints();
        this.vehicleElements = new Map();
        
        if (!this.mapContainer) {
            console.error('Map container not found');
            return;
        }
        
        this.renderInitialMap();
        
        console.log('✅ MapUI initialized with', this.routes.length, 'routes');
    }

    generateCityPoints() {
        return [
            { name: "Downtown", x: 150, y: 150 },
            { name: "CBD", x: 300, y: 200 },
            { name: "Industrial", x: 400, y: 500 },
            { name: "Airport", x: 800, y: 150 },
            { name: "University", x: 700, y: 450 },
            { name: "Ghetto", x: 100, y: 500 },
            { name: "Suburbs", x: 600, y: 300 },
            { name: "Market", x: 350, y: 350 },
            { name: "Hospital", x: 500, y: 200 },
            { name: "Stadium", x: 550, y: 500 },
            { name: "Mall", x: 450, y: 100 },
            { name: "Port", x: 50, y: 300 }
        ];
    }

    renderInitialMap() {
        if (!this.mapContainer) return;
        
        // Clear existing content
        this.mapContainer.innerHTML = '';
        
        // Create SVG for routes
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 5;
            pointer-events: none;
        `;
        svg.setAttribute('viewBox', '0 0 1000 600');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Add background pattern
        this.addBackgroundPattern(svg);

        // Render routes
        if (this.routes && this.routes.length > 0) {
            this.routes.forEach(route => {
                if (!route || !route.id) return;
                
                const routeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                routeGroup.setAttribute('class', 'route');
                routeGroup.setAttribute('data-route-id', route.id);
                routeGroup.style.pointerEvents = 'all';
                routeGroup.style.cursor = 'pointer';

                if (route.waypoints && route.waypoints.length > 0) {
                    this.renderMultiPointRoute(svg.namespaceURI, routeGroup, route);
                } else {
                    this.renderStandardRoute(svg.namespaceURI, routeGroup, route);
                }

                // Add click handler
                routeGroup.addEventListener('click', () => {
                    if (this.routeDeletionMode) {
                        this.deleteRoute(route.id);
                    } else if (!this.routeCreationMode && this.onRouteClick) {
                        this.onRouteClick(route.id);
                    }
                });

                svg.appendChild(routeGroup);
            });
        }

        this.mapContainer.appendChild(svg);
        this.setupRouteCreation();
        this.setupRouteDeletion();
        this.updateRouteSelectability();
        
        console.log(`✅ Map rendered with ${this.routes.length} routes`);
    }

    addBackgroundPattern(svg) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'grid');
        pattern.setAttribute('width', '50');
        pattern.setAttribute('height', '50');
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 50 0 L 0 0 0 50');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(255,255,255,0.1)');
        path.setAttribute('stroke-width', '1');
        
        pattern.appendChild(path);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grid)');
        svg.appendChild(rect);
    }

    renderStandardRoute(svgNS, routeGroup, route) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', route.startX);
        line.setAttribute('y1', route.startY);
        line.setAttribute('x2', route.endX);
        line.setAttribute('y2', route.endY);
        line.setAttribute('stroke', route.custom ? '#ff9800' : '#ffc107');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-dasharray', route.custom ? '10,5' : 'none');
        line.setAttribute('opacity', '0.8');
        
        const startCircle = document.createElementNS(svgNS, 'circle');
        startCircle.setAttribute('cx', route.startX);
        startCircle.setAttribute('cy', route.startY);
        startCircle.setAttribute('r', '8');
        startCircle.setAttribute('fill', '#4CAF50');
        startCircle.setAttribute('stroke', '#fff');
        startCircle.setAttribute('stroke-width', '2');
        
        const endCircle = document.createElementNS(svgNS, 'circle');
        endCircle.setAttribute('cx', route.endX);
        endCircle.setAttribute('cy', route.endY);
        endCircle.setAttribute('r', '8');
        endCircle.setAttribute('fill', '#f44336');
        endCircle.setAttribute('stroke', '#fff');
        endCircle.setAttribute('stroke-width', '2');
        
        const labelX = (route.startX + route.endX) / 2;
        const labelY = (route.startY + route.endY) / 2;
        
        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', 'white');
        label.setAttribute('font-size', '12');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('paint-order', 'stroke');
        label.setAttribute('stroke', 'rgba(0,0,0,0.8)');
        label.setAttribute('stroke-width', '3');
        label.textContent = route.name.split(' > ')[0];
        
        routeGroup.appendChild(line);
        routeGroup.appendChild(startCircle);
        routeGroup.appendChild(endCircle);
        routeGroup.appendChild(label);
    }

    renderMultiPointRoute(svgNS, routeGroup, route) {
        const points = [
            { x: route.startX, y: route.startY },
            ...(route.waypoints || []),
            { x: route.endX, y: route.endY }
        ];
        
        for (let i = 0; i < points.length - 1; i++) {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', points[i].x);
            line.setAttribute('y1', points[i].y);
            line.setAttribute('x2', points[i + 1].x);
            line.setAttribute('y2', points[i + 1].y);
            line.setAttribute('stroke', '#ff9800');
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-dasharray', '10,5');
            line.setAttribute('opacity', '0.8');
            routeGroup.appendChild(line);
        }
        
        points.forEach((point, index) => {
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '6');
            
            if (index === 0) {
                circle.setAttribute('fill', '#4CAF50');
            } else if (index === points.length - 1) {
                circle.setAttribute('fill', '#f44336');
            } else {
                circle.setAttribute('fill', '#ff9800');
            }
            
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            routeGroup.appendChild(circle);
        });
        
        const midPoint = points[Math.floor(points.length / 2)];
        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', midPoint.x);
        label.setAttribute('y', midPoint.y - 15);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', 'white');
        label.setAttribute('font-size', '11');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('paint-order', 'stroke');
        label.setAttribute('stroke', 'rgba(0,0,0,0.8)');
        label.setAttribute('stroke-width', '3');
        label.textContent = `${route.start} → ${route.end}`;
        routeGroup.appendChild(label);
    }

    setupRouteCreation() {
        const existingBtn = this.mapContainer.querySelector('.create-route-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const createBtn = document.createElement('button');
        createBtn.textContent = '+ Create Route';
        createBtn.className = 'create-route-btn';
        createBtn.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: var(--primary-color);
            color: var(--bg-dark);
            border: none;
            padding: 0.8rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            z-index: 100;
            font-size: 0.9rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            min-width: 120px;
            text-align: center;
            white-space: nowrap;
            user-select: none;
        `;
        
        createBtn.addEventListener('click', () => this.toggleRouteCreation());
        this.mapContainer.appendChild(createBtn);
    }

    setupRouteDeletion() {
        const existingBtn = this.mapContainer.querySelector('.delete-route-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Delete Route';
        deleteBtn.className = 'delete-route-btn';
        deleteBtn.style.cssText = `
            position: absolute;
            top: 10px;
            left: 150px;
            background: var(--danger-color);
            color: white;
            border: none;
            padding: 0.8rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            z-index: 100;
            font-size: 0.9rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            min-width: 140px;
            text-align: center;
            white-space: nowrap;
            user-select: none;
        `;
        
        deleteBtn.addEventListener('click', () => this.toggleRouteDeletion());
        this.mapContainer.appendChild(deleteBtn);
    }

    toggleRouteCreation() {
        this.routeCreationMode = !this.routeCreationMode;
        this.routeDeletionMode = false;
        this.selectedPoints = [];
        
        const createBtn = this.mapContainer.querySelector('.create-route-btn');
        const deleteBtn = this.mapContainer.querySelector('.delete-route-btn');
        
        if (this.routeCreationMode) {
            createBtn.innerHTML = '❌ Cancel';
            createBtn.style.background = 'var(--danger-color)';
            createBtn.style.color = 'white';
            
            if (deleteBtn) {
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.pointerEvents = 'none';
            }
            
            this.showCityPoints();
            this.showRouteCreationInstructions();
        } else {
            createBtn.innerHTML = '+ Create Route';
            createBtn.style.background = 'var(--primary-color)';
            createBtn.style.color = 'var(--bg-dark)';
            
            if (deleteBtn) {
                deleteBtn.style.opacity = '1';
                deleteBtn.style.pointerEvents = 'auto';
            }
            
            this.hideCityPoints();
            this.hideRouteCreationInstructions();
            this.hideCreateRouteButton();
        }
        
        this.updateRouteSelectability();
    }

    toggleRouteDeletion() {
        this.routeDeletionMode = !this.routeDeletionMode;
        this.routeCreationMode = false;
        this.selectedPoints = [];
        
        const createBtn = this.mapContainer.querySelector('.create-route-btn');
        const deleteBtn = this.mapContainer.querySelector('.delete-route-btn');
        
        if (this.routeDeletionMode) {
            deleteBtn.textContent = '❌ Cancel';
            deleteBtn.style.background = 'var(--warning-color)';
            if (createBtn) {
                createBtn.style.opacity = '0.5';
                createBtn.style.pointerEvents = 'none';
            }
            this.showDeletionInstructions();
        } else {
            deleteBtn.textContent = '🗑️ Delete Route';
            deleteBtn.style.background = 'var(--danger-color)';
            if (createBtn) {
                createBtn.style.opacity = '1';
                createBtn.style.pointerEvents = 'auto';
            }
            this.hideDeletionInstructions();
        }
        
        this.updateRouteSelectability();
    }

    showCityPoints() {
        this.hideCityPoints();
        
        this.cityPoints.forEach(point => {
            const pointEl = document.createElement('div');
            pointEl.className = 'city-point';
            pointEl.style.cssText = `
                position: absolute;
                left: ${(point.x/1000)*100}%;
                top: ${(point.y/600)*100}%;
                width: 35px;
                height: 35px;
                background: var(--secondary-color);
                border: 3px solid white;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 50;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                color: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                transition: all 0.3s ease;
            `;
            pointEl.textContent = point.name.substring(0, 2);
            pointEl.title = point.name;
            pointEl.addEventListener('click', () => this.selectCityPoint(point));
            this.mapContainer.appendChild(pointEl);
        });
    }

    hideCityPoints() {
        this.mapContainer.querySelectorAll('.city-point').forEach(el => el.remove());
    }

    selectCityPoint(point) {
        if (!this.routeCreationMode) return;

        const existingIndex = this.selectedPoints.findIndex(p => p.name === point.name);
        
        if (existingIndex >= 0) {
            this.selectedPoints.splice(existingIndex, 1);
        } else {
            this.selectedPoints.push(point);
        }
        
        this.updateCityPointsDisplay();
        this.updateSelectedPointsDisplay();
    }

    updateCityPointsDisplay() {
        this.mapContainer.querySelectorAll('.city-point').forEach(el => {
            const pointName = el.title;
            const isSelected = this.selectedPoints.some(p => p.name === pointName);
            const selectionIndex = this.selectedPoints.findIndex(p => p.name === pointName);
            
            if (isSelected) {
                el.style.background = 'var(--primary-color)';
                el.style.transform = 'translate(-50%, -50%) scale(1.3)';
                el.textContent = (selectionIndex + 1).toString();
                el.style.fontSize = '14px';
            } else {
                el.style.background = 'var(--secondary-color)';
                el.style.transform = 'translate(-50%, -50%) scale(1)';
                el.textContent = pointName.substring(0, 2);
                el.style.fontSize = '12px';
            }
        });
    }

    showRouteCreationInstructions() {
        this.hideRouteCreationInstructions();
        
        const instructions = document.createElement('div');
        instructions.className = 'route-creation-instructions';
        instructions.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 200;
            max-width: 300px;
            text-align: center;
            border: 2px solid var(--primary-color);
            backdrop-filter: blur(10px);
        `;
        
        instructions.innerHTML = `
            <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">🗺️ Create Multi-Point Route</h4>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; line-height: 1.4;">
                1. Click city points in order (minimum 2 points)<br>
                2. Click "Create Route" when ready<br>
                3. Routes can pass through multiple cities
            </p>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                Selected: <span id="selected-count">0</span> points
            </div>
        `;
        
        this.mapContainer.appendChild(instructions);
    }

    hideRouteCreationInstructions() {
        const existing = this.mapContainer.querySelector('.route-creation-instructions');
        if (existing) {
            existing.remove();
        }
    }

    showDeletionInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'route-deletion-instructions';
        instructions.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(244,67,54,0.9);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 200;
            max-width: 300px;
            text-align: center;
            border: 2px solid var(--danger-color);
        `;
        
        instructions.innerHTML = `
            <h4 style="margin: 0 0 0.5rem 0;">🗑️ Delete Routes</h4>
            <p style="margin: 0; font-size: 0.9rem;">
                Click on any custom route to delete it.<br>
                <small>Note: Only custom routes can be deleted.</small>
            </p>
        `;
        
        this.mapContainer.appendChild(instructions);
    }

    hideDeletionInstructions() {
        const existing = this.mapContainer.querySelector('.route-deletion-instructions');
        if (existing) {
            existing.remove();
        }
    }

    updateSelectedPointsDisplay() {
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = this.selectedPoints.length;
        }
        
        if (this.selectedPoints.length >= 2) {
            this.showCreateRouteButton();
        } else {
            this.hideCreateRouteButton();
        }
    }

    showCreateRouteButton() {
        const existingBtn = this.mapContainer.querySelector('.create-multi-route-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const createBtn = document.createElement('button');
        createBtn.textContent = `✅ Create Route (${this.selectedPoints.length} points)`;
        createBtn.className = 'create-multi-route-btn';
        createBtn.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--secondary-color);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            z-index: 200;
            font-size: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        createBtn.addEventListener('click', () => this.createMultiPointRoute());
        this.mapContainer.appendChild(createBtn);
    }

    hideCreateRouteButton() {
        const btn = this.mapContainer.querySelector('.create-multi-route-btn');
        if (btn) {
            btn.remove();
        }
    }

    createMultiPointRoute() {
        if (this.selectedPoints.length < 2) {
            if (window.gameInstance && window.gameInstance.dashboardUI) {
                window.gameInstance.dashboardUI.showToast('Select at least 2 city points!', 'error');
            }
            return;
        }
        
        const routeName = this.generateRouteNameFromPoints();
        const totalDistance = this.calculateRouteDistance();
        
        const newRoute = {
            id: `custom_route_${Date.now()}`,
            name: routeName,
            start: this.selectedPoints[0].name,
            end: this.selectedPoints[this.selectedPoints.length - 1].name,
            startX: this.selectedPoints[0].x,
            startY: this.selectedPoints[0].y,
            endX: this.selectedPoints[this.selectedPoints.length - 1].x,
            endY: this.selectedPoints[this.selectedPoints.length - 1].y,
            distance: totalDistance,
            passengerFlow: Math.max(3, Math.min(9, Math.floor(this.selectedPoints.length * 2 + Math.random() * 3))),
            profit: Math.round(totalDistance * 15 + this.selectedPoints.length * 50),
            risk: Math.max(1, Math.min(8, Math.floor(totalDistance / 5 + this.selectedPoints.length / 2))),
            custom: true,
            waypoints: this.selectedPoints.slice(1, -1),
            assignedVehicles: [],
            fare: Math.round(totalDistance * 5 + 30),
            createdAt: Date.now()
        };
        
        if (window.gameInstance && window.gameInstance.managers.route) {
            window.gameInstance.managers.route.customRoutes.push(newRoute);
            this.routes.push(newRoute);
            
            this.renderInitialMap();
            
            if (window.gameInstance.components.dashboard) {
                window.gameInstance.components.dashboard.showToast(
                    `Created multi-point route: ${routeName}`, 
                    'success'
                );
            }

            if (window.gameInstance.progressionManager) {
                window.gameInstance.progressionManager.evaluateProgress();
            }
            
            console.log('Multi-point route created:', newRoute);
        }
        
        this.toggleRouteCreation();
    }

    generateRouteNameFromPoints() {
        if (this.selectedPoints.length === 2) {
            return `${this.selectedPoints[0].name} > ${this.selectedPoints[1].name}`;
        } else {
            const start = this.selectedPoints[0].name;
            const end = this.selectedPoints[this.selectedPoints.length - 1].name;
            const waypoints = this.selectedPoints.slice(1, -1).length;
            return `${start} > ${end} (${waypoints} stops)`;
        }
    }

    calculateRouteDistance() {
        let totalDistance = 0;
        
        for (let i = 0; i < this.selectedPoints.length - 1; i++) {
            const point1 = this.selectedPoints[i];
            const point2 = this.selectedPoints[i + 1];
            
            const dx = point2.x - point1.x;
            const dy = point2.y - point1.y;
            const distance = Math.sqrt(dx * dx + dy * dy) / 50;
            
            totalDistance += distance;
        }
        
        return Math.round(totalDistance);
    }

    updateRouteSelectability() {
        const routeElements = this.mapContainer.querySelectorAll('.route');
        routeElements.forEach(el => {
            if (this.routeCreationMode || this.routeDeletionMode) {
                el.style.pointerEvents = this.routeDeletionMode ? 'all' : 'none';
                el.style.opacity = this.routeDeletionMode ? '1' : '0.5';
            } else {
                el.style.pointerEvents = 'all';
                el.style.opacity = '1';
            }
        });
    }

    updateVehiclePositions() {
        if (!this.vehicleManager) return;
        
        const vehicles = this.vehicleManager.getVehicles();
        const runningVehicles = vehicles.filter(v => v.status === 'running' && v.routeId);
        
        // Create a Set of current running vehicle IDs for efficient lookup
        const runningVehicleIds = new Set(runningVehicles.map(v => v.id));
        
        // Remove vehicles no longer running
        for (const [vehicleId, element] of this.vehicleElements) {
            if (!runningVehicleIds.has(vehicleId)) {
                element.remove();
                this.vehicleElements.delete(vehicleId);
            }
        }
        
        // Update or create vehicle elements
        runningVehicles.forEach(vehicle => {
            let element = this.vehicleElements.get(vehicle.id);
            if (!element) {
                element = this.createVehicleElement(vehicle);
                if (element) {
                    this.mapContainer.appendChild(element);
                    this.vehicleElements.set(vehicle.id, element);
                }
            }
            if (element) {
                this.updateVehiclePosition(vehicle, element);
            }
        });
    }

    createVehicleElement(vehicle) {
        const element = document.createElement('div');
        element.id = `matatu-${vehicle.id}`;
        element.className = 'matatu-on-map';
        
        const nickname = vehicle.nickname || this.generateDefaultNickname(vehicle.name);
        
        element.innerHTML = `
            <div class="vehicle-icon">🚐</div>
            <div class="vehicle-nickname">${nickname}</div>
        `;
        
        element.style.cssText = `
            position: absolute;
            min-width: 35px;
            height: auto;
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            border: 2px solid white;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            z-index: 10;
            pointer-events: none;
            transition: all 0.1s linear;
            padding: 2px 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transform: translate(-50%, -50%);
        `;
        
        element.title = `${vehicle.name} (${vehicle.status})`;
        
        return element;
    }

    updateVehiclePosition(vehicle, element) {
        const route = this.routes.find(r => r.id === vehicle.routeId);
        if (!route) return;

        // Update nickname if changed
        const nicknameEl = element.querySelector('.vehicle-nickname');
        const currentNickname = vehicle.nickname || this.generateDefaultNickname(vehicle.name);
        if (nicknameEl && nicknameEl.textContent !== currentNickname) {
            nicknameEl.textContent = currentNickname;
            element.title = `${vehicle.name} (${vehicle.status})`;
        }
        
        // Update status color
        let statusColor = '#4CAF50';
        if (vehicle.fuel < 30) statusColor = '#ff9800';
        if (vehicle.condition < 30) statusColor = '#f44336';
        
        element.style.background = `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`;

        // Calculate position along route
        const vehicleOffset = vehicle.id * 1000;
        const duration = Math.max(route.distance * 2, 10);
        const currentTime = (performance.now() + vehicleOffset) / 1000;
        const progress = (currentTime % duration) / duration;
        
        let x, y;
        if (progress < 0.5) {
            const t = progress * 2;
            x = route.startX + (route.endX - route.startX) * t;
            y = route.startY + (route.endY - route.startY) * t;
        } else {
            const t = (progress - 0.5) * 2;
            x = route.endX + (route.startX - route.endX) * t;
            y = route.endY + (route.startY - route.endY) * t;
        }
        
        element.style.left = `${(x/1000)*100}%`;
        element.style.top = `${(y/600)*100}%`;
    }

    generateDefaultNickname(fullName) {
        const words = fullName.split(' ');
        if (words.length >= 2) {
            return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
        } else {
            return fullName.substring(0, 3).toUpperCase();
        }
    }

    updateRoutes(newRoutes) {
        this.routes = newRoutes || [];
        this.renderInitialMap();
    }

    deleteRoute(routeId) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return;
        
        if (!route.custom) {
            if (window.gameInstance && window.gameInstance.components.dashboard) {
                window.gameInstance.components.dashboard.showToast('Cannot delete default routes!', 'error');
            }
            return;
        }
        
        this.routes = this.routes.filter(r => r.id !== routeId);
        
        if (window.gameInstance && window.gameInstance.managers.route) {
            window.gameInstance.managers.route.removeCustomRoute(routeId);
        }

        this.routeDeletionMode = false;
        this.hideDeletionInstructions();
        
        this.renderInitialMap();
        
        if (window.gameInstance && window.gameInstance.components.dashboard) {
            window.gameInstance.components.dashboard.showToast('Route deleted successfully!', 'success');
        }
    }
}
