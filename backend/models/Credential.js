const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    credentialId: { type: String, required: true, unique: true },
    studentEmail: { type: String, required: true },
    institutionAddress: { type: String, required: true },
    pdfPath: { type: String, required: true }, // Where the PDF is saved on the server
    documentHash: { type: String, required: true }, // The SHA-256 hash we sent to the blockchain
    transactionHash: { type: String }, // The blockchain receipt ID
    status: { 
        type: String, 
        enum: ['Pending', 'Issued', 'Revoked'], 
        default: 'Pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Credential', credentialSchema);