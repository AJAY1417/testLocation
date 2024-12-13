const loginForm = document.querySelector('form');
let liveTracking = false;
let intervalId = null;

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, latitude, longitude }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Login successful', data);
          localStorage.setItem('userEmail', data.data.email);
          window.location.href = '/dashboard';
        } else {
          console.error('Login failed');
        }
      } catch (error) {
        console.error('Error during login:', error);
      }
    }, () => {
        console.error('Geolocation is not supported by this browser.');
        // Handle the case where geolocation is not available
        // You might want to proceed with login without location or prompt the user
        // to manually enter their location
    });
  } else {
    console.error('Geolocation is not supported by this browser.');
    // Handle the case where geolocation is not available
    // You might want to proceed with login without location or prompt the user
    // to manually enter their location
  }
});


const startLiveTracking = () => {
    liveTracking = true;
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
};

const stopLiveTracking = () => {
    liveTracking = false;
    clearInterval(intervalId);
};
