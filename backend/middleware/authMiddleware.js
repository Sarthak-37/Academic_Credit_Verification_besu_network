const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get the token from the request header
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        // 2. Verify the token using our secret key
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach the user data to the request so the next function can use it
        req.user = decoded;
        next(); // Proceed to the actual route
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};