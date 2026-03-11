export class RouteManager {
    constructor() {
        this.routes = [];
        this.customRoutes = [];
        // Don't call loadRoutes in constructor to avoid async issues
    }

    async loadRoutes() {
        try {
            const response = await fetch('./data/routes.json');
            const data = await response.json();
            
            // Ensure all routes have required properties
            this.routes = data.map(route => ({
                ...route,
                assignedVehicles: route.assignedVehicles || [],
                fare: route.fare || 50
            }));
            
            console.log('Routes loaded:', this.routes.length);
        } catch (error) {
            console.error('Failed to load routes:', error);
            // Fallback routes if file doesn't load
            this.routes = this.getDefaultRoutes();
        }
    }

    getDefaultRoutes() {
        return [
            {
                "id": "route1",
                "name": "Downtown > Industrial",
                "start": "Downtown",
                "end": "Industrial",
                "startX": 150, "startY": 150,
                "endX": 400, "endY": 500,
                "distance": 12,
                "passengerFlow": 8,
                "profit": 150,
                "risk": 4,
                "assignedVehicles": [],
                "fare": 50
            },
            {
                "id": "route2",
                "name": "CBD > Airport",
                "start": "CBD",
                "end": "Airport",
                "startX": 300, "startY": 200,
                "endX": 800, "endY": 150,
                "distance": 20,
                "passengerFlow": 9,
                "profit": 300,
                "risk": 6,
                "assignedVehicles": [],
                "fare": 75
            },
            {
                "id": "route3",
                "name": "Ghetto > Uni",
                "start": "Ghetto",
                "end": "University",
                "startX": 100, "startY": 500,
                "endX": 700, "endY": 450,
                "distance": 15,
                "passengerFlow": 10,
                "profit": 220,
                "risk": 8,
                "assignedVehicles": [],
                "fare": 60
            }
        ];
    }

    initializeCustomRoutes(savedCustomRoutes) {
        if (savedCustomRoutes && Array.isArray(savedCustomRoutes)) {
            this.customRoutes = savedCustomRoutes.map(route => ({
                ...route,
                assignedVehicles: route.assignedVehicles || []
            }));
        } else {
            this.customRoutes = [];
        }
        console.log('Custom routes initialized:', this.customRoutes.length);
    }

    getStandardRoutes() {
        return this.routes || [];
    }

    getCustomRoutes() {
        return this.customRoutes || [];
    }

    getRoutes() {
        return [...(this.routes || []), ...(this.customRoutes || [])];
    }

    getAllRoutes() {
        return this.getRoutes();
    }

    getRouteById(id) {
        // Check standard routes first
        let route = (this.routes || []).find(r => r && r.id === id);
        
        // If not found, check custom routes
        if (!route && this.customRoutes) {
            route = this.customRoutes.find(r => r && r.id === id);
        }
        
        return route;
    }
    
    assignVehicleToRoute(vehicleId, routeId) {
        const route = this.getRouteById(routeId);
        if (route) {
            if (!route.assignedVehicles) {
                route.assignedVehicles = [];
            }
            if (!route.assignedVehicles.includes(vehicleId)) {
                route.assignedVehicles.push(vehicleId);
            }
        }
    }
    
    unassignVehicleFromRoute(vehicleId, routeId) {
        const route = this.getRouteById(routeId);
        if (route && route.assignedVehicles) {
            route.assignedVehicles = route.assignedVehicles.filter(id => id !== vehicleId);
        }
    }

    createCustomRoute(startPoint, endPoint) {
        const routeId = `custom_${Date.now()}`;
        const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + 
            Math.pow(endPoint.y - startPoint.y, 2)
        ) / 50; // Scale down for reasonable distance

        const customRoute = {
            id: routeId,
            name: `${startPoint.name} > ${endPoint.name}`,
            start: startPoint.name,
            end: endPoint.name,
            startX: startPoint.x,
            startY: startPoint.y,
            endX: endPoint.x,
            endY: endPoint.y,
            distance: Math.max(5, Math.floor(distance)),
            passengerFlow: Math.floor(Math.random() * 5) + 6, // 6-10
            profit: Math.floor(distance * 15) + 100, // Base profit
            risk: Math.floor(Math.random() * 8) + 2, // 2-9
            custom: true,
            assignedVehicles: [],
            fare: Math.floor(distance * 5) + 30 // Dynamic fare based on distance
        };

        this.customRoutes.push(customRoute);
        return customRoute;
    }

    removeCustomRoute(routeId) {
        // Remove from custom routes
        this.customRoutes = this.customRoutes.filter(r => r.id !== routeId);
        
        // Unassign any vehicles from this route
        if (window.gameInstance && window.gameInstance.vehicleManager) {
            const vehicles = window.gameInstance.vehicleManager.getVehicles();
            vehicles.forEach(vehicle => {
                if (vehicle.routeId === routeId) {
                    window.gameInstance.unassignVehicleFromRoute(vehicle.id, routeId);
                }
            });
        }
        
        console.log(`Custom route ${routeId} removed`);
    }

    canDeleteRoute(routeId) {
        const route = this.getRouteById(routeId);
        if (!route) return false;
        
        // Can delete custom routes or routes with no assigned vehicles
        const hasAssignedVehicles = route.assignedVehicles && route.assignedVehicles.length > 0;
        return route.custom || !hasAssignedVehicles;
    }
}
