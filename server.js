require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 2345;
const ratingRoutes = require('./routes/ratings');

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ratings', ratingRoutes);

app.get('/', (req, res) => {
    res.send('Hello from Node API Server Updated');
});


mongoose.connect(process.env.MONGO_URL  || 'mongodb://localhost:27017/worknook')
.then(() => {
    console.log("Connected to database!");
    app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
})
.catch((err) => {
    console.log("connection failed");
})