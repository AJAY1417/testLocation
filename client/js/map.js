let map = null;
let marker = null;
let accuracyCircle = null;
let pathLine = null;
let locationHistory = [];

const mapConfig = {
    zoom: 13,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: ' OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 3
};

function initializeMap(latitude, longitude) {
    try {
        if (map) cleanupMap();
        
        map = L.map('map', {
            center: [latitude, longitude],
            zoom: mapConfig.zoom,
            zoomControl: true,
            scrollWheelZoom: true
        });

        // Add different map layers
        const streets = L.tileLayer(mapConfig.tileUrl, {
            attribution: mapConfig.attribution,
            maxZoom: mapConfig.maxZoom,
            minZoom: mapConfig.minZoom
        }).addTo(map);

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: ' Esri',
            maxZoom: mapConfig.maxZoom,
            minZoom: mapConfig.minZoom
        });

        const baseMaps = {
            "Streets": streets,
            "Satellite": satellite
        };

        L.control.layers(baseMaps).addTo(map);

        // Add marker with custom popup
        marker = L.marker([latitude, longitude], {
            draggable: false,
            title: 'Current Location'
        }).addTo(map)
        .bindPopup('Current Location')
        .openPopup();

        // Initialize path line
        pathLine = L.polyline([], {
            color: '#2196F3',
            weight: 3,
            opacity: 0.7
        }).addTo(map);

        // Add zoom controls
        map.zoomControl.setPosition('bottomright');

        // Add scale control
        L.control.scale().addTo(map);

        addMapEventListeners();
        return true;
    } catch (error) {
        console.error('Error initializing map:', error);
        return false;
    }
}

function updateLocation(latitude, longitude, accuracy = null) {
    if (!map || !marker) {
        console.error('Map or marker not initialized');
        return false;
    }
    try {
        const newLatLng = [latitude, longitude];
        
        // Update marker
        marker.setLatLng(newLatLng)
            .bindPopup('Current Location<br>Lat: ' + latitude.toFixed(6) + '<br>Lng: ' + longitude.toFixed(6))
            .openPopup();

        // Update accuracy circle if provided
        if (accuracy) {
            if (accuracyCircle) {
                accuracyCircle.remove();
            }
            accuracyCircle = L.circle(newLatLng, {
                radius: accuracy,
                color: '#2196F3',
                fillColor: '#2196F3',
                fillOpacity: 0.1
            }).addTo(map);
        }

        // Update path
        locationHistory.push(newLatLng);
        pathLine.setLatLngs(locationHistory);
        
        // Smooth pan to new location
        map.panTo(newLatLng, {
            animate: true,
            duration: 0.5
        });
        
        return true;
    } catch (error) {
        console.error('Error updating location:', error);
        return false;
    }
}

function cleanupMap() {
    if (map) {
        locationHistory = [];
        if (accuracyCircle) accuracyCircle.remove();
        if (pathLine) pathLine.remove();
        map.off();
        map.remove();
        map = null;
        marker = null;
        accuracyCircle = null;
        pathLine = null;
    }
}

function addMapEventListeners() {
    if (!map) return;
    
    map.on('error', (e) => {
        console.error('Map error:', e.error);
    });

    map.on('load', () => {
        console.log('Map loaded successfully');
    });

    map.on('zoomend', () => {
        const currentZoom = map.getZoom();
        console.log('Map zoom level:', currentZoom);
    });
}

function clearPath() {
    locationHistory = [];
    if (pathLine) {
        pathLine.setLatLngs([]);
    }
}

// Export functions
window.initializeMap = initializeMap;
window.updateLocation = updateLocation;
window.cleanupMap = cleanupMap;
window.clearPath = clearPath;

let socket = io();
let watchId = null;
let isTracking = false;

function initializeElements() {
    return {
        liveTrackingBtn: document.getElementById('live-tracking'),
        currentLatitude: document.getElementById('current-latitude'),
        currentLongitude: document.getElementById('current-longitude'),
        lastUpdated: document.getElementById('last-updated'),
        locationHistory: document.getElementById('location-history')
    };
}

function updateLocationDisplay(data) {
    elements.currentLatitude.textContent = data.latitude.toFixed(6);
    elements.currentLongitude.textContent = data.longitude.toFixed(6);
    elements.lastUpdated.textContent = new Date().toLocaleString();
    
    // Update map
    updateLocation(data.latitude, data.longitude);
    
    // Update history
    const historyHtml = data.locationHistory
        .slice()
        .reverse()
        .map(loc => `
            <div class="history-item">
                <div class="coordinates">
                    Lat: ${loc.latitude.toFixed(6)}, 
                    Lng: ${loc.longitude.toFixed(6)}
                </div>
                <div class="timestamp">
                    ${new Date(loc.timestamp).toLocaleString()}
                </div>
            </div>
        `).join('');
    elements.locationHistory.innerHTML = historyHtml;
}

function startTracking(userEmail) {
    isTracking = true;
    elements.liveTrackingBtn.textContent = 'Stop Live Tracking';
    elements.liveTrackingBtn.classList.add('tracking-active');
    socket.emit('startTracking', userEmail);

    if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                socket.emit('updateLocation', {
                    email: userEmail,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => console.error('Error:', error),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 500
            }
        );
    }
}

function stopTracking() {
    isTracking = false;
    elements.liveTrackingBtn.textContent = 'Start Live Tracking';
    elements.liveTrackingBtn.classList.remove('tracking-active');
    
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    socket.emit('stopTracking');
}

const elements = initializeElements();
const userEmail = document.getElementById('user-email').textContent;

// Initialize map with current position
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
        initializeMap(position.coords.latitude, position.coords.longitude);
    });
}

// Event Listeners
elements.liveTrackingBtn.addEventListener('click', () => {
    if (!isTracking) {
        startTracking(userEmail);
    } else {
        stopTracking();
    }
});

// Socket handlers
socket.on('locationUpdated', (data) => {
    updateLocationDisplay(data);
});
