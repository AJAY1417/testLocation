const socket = io();
const welcomeMessage = document.getElementById('welcome-message');
const locationDiv = document.getElementById('location');
const mapDiv = document.getElementById('map');
const liveTrackButton = document.getElementById('live-track-button');
let map;
let marker;
let liveTracking = false;

const userEmail = localStorage.getItem('userEmail');
welcomeMessage.textContent = `Welcome ${userEmail}`;

const initMap = (lat, lng) => {
    map = new google.maps.Map(mapDiv, {
        center: { lat, lng },
        zoom: 15,
    });
    marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
    });
};

const updateMap = (lat, lng) => {
    map.setCenter({ lat, lng });
    marker.setPosition({ lat, lng });
};

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        locationDiv.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
        initMap(latitude, longitude);
    }, () => {
        locationDiv.textContent = 'Unable to get location';
    });
} else {
    locationDiv.textContent = 'Geolocation is not supported by this browser.';
}

liveTrackButton.addEventListener('click', () => {
    if (!liveTracking) {
        startLiveTracking();
        liveTrackButton.textContent = 'Stop Live Track';
        liveTracking = true;
    } else {
        stopLiveTracking();
        liveTrackButton.textContent = 'Start Live Track';
        liveTracking = false;
    }
});





function startLiveTracking() {
    intervalId = setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const email = localStorage.getItem('userEmail');
                try {
                    const response = await fetch('/api/users/update-location', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, latitude, longitude }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Location updated', data);
                        locationDiv.textContent = `Latitude: ${data.data.latitude}, Longitude: ${data.data.longitude}`;
                        updateMap(data.data.latitude, data.data.longitude);
                    } else {
                        console.error('Location update failed');
                    }
                } catch (error) {
                    console.error('Error updating location:', error);
                }
            }, () => {
                console.error('Geolocation is not supported by this browser.');
            });
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }, 10000);
}

function stopLiveTracking() {
    clearInterval(intervalId);
}
