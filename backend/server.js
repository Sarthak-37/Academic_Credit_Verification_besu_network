require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { checkBlockchainConnection } = require('./blockchain/besuService');
const authRoutes = require('./routes/authRoutes'); // IMPORT NEW ROUTES
const credentialRoutes = require('./routes/credentialRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use Routes
app.use('/api/auth', authRoutes); // TELL EXPRESS TO USE THEM
app.use('/api/credentials', credentialRoutes);

// Test Route
app.get('/api/status', (req, res) => {
    res.json({ message: 'Decentralized Credential API is running' });
});

// Initialize Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await checkBlockchainConnection();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();