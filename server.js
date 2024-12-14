const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./server/config/db');
const path = require('path');
const User = require('./server/models/user');
const { success, error } = require('./server/utils/apiResponse');
const userRoutes = require('./server/routes/user');
const http = require('http');
const socketIO = require('socket.io');
const errorHandler = require('./server/middleware/errorHandler');
const logger = require('./server/middleware/logger');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger); 
app.use(express.static(path.join(__dirname, 'client')));
app.use('/api/users', userRoutes);

app.use(errorHandler);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'server', 'views'));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('startTracking', async (email) => {
        console.log('Start tracking for:', email);
        socket.userEmail = email;
    });

    socket.on('updateLocation', async (data) => {
        try {
            const { email, latitude, longitude } = data;
            const user = await User.findOne({ email });

            if (!user) {
                socket.emit('error', 'User not found');
                return;
            }

            const isSameLocation = user.latitude === latitude && user.longitude === longitude;
            const now = new Date();

            // Update user's current location and timestamp
            user.latitude = latitude;
            user.longitude = longitude;
            user.lastUpdated = now;

            // Add to history only if location changed or it's been more than 5 minutes
            if (!isSameLocation || !user.locationHistory.length || 
                (now - user.locationHistory[user.locationHistory.length - 1].timestamp) > 300000) {
                
                user.locationHistory.push({
                    latitude,
                    longitude,
                    timestamp: now
                });

                // Keep only last 10 locations
                if (user.locationHistory.length > 10) {
                    user.locationHistory.shift();
                }
            }

            await user.save();

            // Emit updated data back to client
            socket.emit('locationUpdated', {
                latitude,
                longitude,
                lastUpdated: now,
                locationHistory: user.locationHistory
            });

        } catch (err) {
            console.error('Error updating location:', err);
            socket.emit('error', 'Error updating location');
        }
    });

    socket.on('stopTracking', () => {
        console.log('Stop tracking for:', socket.userEmail);
        socket.userEmail = null;
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/dashboard', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            console.log('No email provided in query');
            return res.redirect('/login');
        }

        const user = await User.findOne({ email }).lean();
        console.log('Dashboard user data:', user);
        
        if (!user) {
            console.log('User not found:', email);
            return res.redirect('/login');
        }

        res.render('dashboard', { 
            user: {
                email: user.email,
                latitude: user.latitude,
                longitude: user.longitude,
                lastUpdated: user.lastUpdated,
                locationHistory: user.locationHistory
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.redirect('/login');
    }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
