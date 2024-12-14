// Initialize map and socket.io
const socket = io();
let map;
let currentMarker;
let isTracking = false;
let watchId = null;

// Initialize map
function initMap() {
    map = L.map('map').setView([user.latitude, user.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
    }).addTo(map);
    currentMarker = L.marker([user.latitude, user.longitude]).addTo(map);
}

function updateLocationDisplay(data) {
    // Update location display
    document.getElementById('current-latitude').textContent = data.latitude.toFixed(6);
    document.getElementById('current-longitude').textContent = data.longitude.toFixed(6);
    document.getElementById('last-updated').textContent = 
        new Date(data.lastUpdated).toLocaleString();

    // Update marker position
    currentMarker.setLatLng([data.latitude, data.longitude]);
    map.setView([data.latitude, data.longitude]);

    // Update history display with reversed order
    const historyHtml = [...data.locationHistory]
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
    document.getElementById('location-history').innerHTML = historyHtml;
}

function startTracking() {
    isTracking = true;
    const liveTrackingBtn = document.getElementById('live-tracking');
    liveTrackingBtn.textContent = 'Stop Live Tracking';
    liveTrackingBtn.classList.add('tracking-active');
    socket.emit('startTracking', user.email);

    if ("geolocation" in navigator) {
        const options = {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 500
        };

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                socket.emit('updateLocation', {
                    email: user.email,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => console.error('Error getting location:', error),
            options
        );
    }
}

function stopTracking() {
    isTracking = false;
    const liveTrackingBtn = document.getElementById('live-tracking');
    liveTrackingBtn.textContent = 'Start Live Tracking';
    liveTrackingBtn.classList.remove('tracking-active');
    
    // Clear the watch
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    socket.emit('stopTracking');
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    initMap();

    // Setup tracking button
    const liveTrackingBtn = document.getElementById('live-tracking');
    if (liveTrackingBtn) {
        liveTrackingBtn.addEventListener('click', () => {
            if (!isTracking) {
                startTracking();
            } else {
                stopTracking();
            }
        });
    }

    // Socket event handlers
    socket.on('locationUpdated', (data) => {
        updateLocationDisplay(data);
    });

    socket.on('error', (message) => {
        console.error('Socket error:', message);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    });
});
