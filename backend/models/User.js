const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['Admin', 'Institution', 'Student'] // Only these roles are allowed
    },
    // The following fields are mainly for Institutions
    institutionName: { type: String },
    blockchainAddress: { type: String }, // The wallet address they use to issue credentials
    isAuthorized: { type: Boolean, default: false } // Admin must approve them
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);