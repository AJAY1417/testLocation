const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./server/config/db');
const userRoutes = require('./server/routes/user');
const path = require('path');

dotenv.config();

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'server', 'views'));

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the homepage!</h1>');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
