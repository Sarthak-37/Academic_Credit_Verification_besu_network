const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { email, password, role, institutionName, blockchainAddress } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user
        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            institutionName,
            blockchainAddress,
            // If they register as a student, they don't need authorization. Institutions do.
            isAuthorized: role === 'Student' ? true : false 
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully. Institutions must wait for Admin approval.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT Token (acts as a digital wristband for logged-in users)
        const token = jwt.sign(
            { id: user._id, role: user.role, blockchainAddress: user.blockchainAddress },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                institutionName: user.institutionName,
                isAuthorized: user.isAuthorized
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};