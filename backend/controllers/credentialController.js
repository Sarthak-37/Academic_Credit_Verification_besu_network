const Credential = require('../models/Credential');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');
const { credentialRegistryContract, getInstitutionContract } = require('../blockchain/besuService');

// 1. GOVERNANCE: Admin authorizes a registered institution on the blockchain
exports.authorizeInstitution = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(404).json({ message: 'User not found in database' });

        // Send transaction to blockchain using the Admin wallet
        const tx = await credentialRegistryContract.registerInstitution(user.blockchainAddress, user.institutionName);
        await tx.wait(); // Wait for validators to confirm the block

        // Update MongoDB status
        user.isAuthorized = true;
        await user.save();

        res.json({ message: 'Institution successfully authorized on the blockchain!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Blockchain error during authorization.' });
    }
};

// 2. ISSUE: Institution hashes a PDF and saves the hash to the blockchain
exports.issueCredential = async (req, res) => {
    try {
        const { studentEmail, credentialId, institutionPrivateKey } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Certificate PDF is required' });

        // Calculate SHA-256 hash of the uploaded PDF
        const fileBuffer = fs.readFileSync(req.file.path);
        const documentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Save metadata off-chain in MongoDB
        const newCredential = new Credential({
            credentialId,
            studentEmail,
            institutionAddress: req.user.blockchainAddress, // From the JWT token
            pdfPath: req.file.path,
            documentHash,
            status: 'Pending'
        });
        await newCredential.save();

        // Connect to blockchain AS the institution using their private key, and send transaction
        const institutionContract = getInstitutionContract(institutionPrivateKey);
        const tx = await institutionContract.issueCredential(credentialId, documentHash);
        const receipt = await tx.wait();

        // Update MongoDB with success
        newCredential.transactionHash = receipt.hash;
        newCredential.status = 'Issued';
        await newCredential.save();

        res.status(201).json({ 
            message: 'Credential successfully issued on the blockchain!',
            transactionHash: receipt.hash,
            documentHash: documentHash
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Blockchain error: You may not be authorized, or the credential ID already exists.' });
    }
};

// 3. VERIFY: Public verification of a PDF against the blockchain hash
exports.verifyCredential = async (req, res) => {
    try {
        const { credentialId } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Certificate PDF is required' });

        // Hash the uploaded document
        const fileBuffer = fs.readFileSync(req.file.path);
        const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Query the Blockchain (Read-only, no gas fees, no private key needed)
        const blockchainRecord = await credentialRegistryContract.verifyCredential(credentialId);
        
        // blockchainRecord returns an array: [documentHash, issuingInstitution, issuanceTimestamp, isRevoked, exists]
        const onChainHash = blockchainRecord[0];
        const exists = blockchainRecord[4];
        const isRevoked = blockchainRecord[3];

        if (!exists) return res.status(404).json({ status: 'NOT FOUND', message: 'Credential ID does not exist on blockchain.' });
        if (isRevoked) return res.status(200).json({ status: 'REVOKED', message: 'Credential was revoked by the issuer.' });

        // Compare the hashes!
        if (calculatedHash === onChainHash) {
            return res.status(200).json({ status: 'VALID', message: 'Authentic document. Hashes match perfectly.' });
        } else {
            return res.status(200).json({ status: 'INVALID', message: 'Fake or tampered document. Hashes do not match.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying credential' });
    }
};

// 4. REVOKE: Institution revokes a previously issued credential
exports.revokeCredential = async (req, res) => {
    try {
        const { credentialId, institutionPrivateKey } = req.body;

        // Connect to blockchain using the institution's private key
        const institutionContract = getInstitutionContract(institutionPrivateKey);
        const tx = await institutionContract.revokeCredential(credentialId);
        const receipt = await tx.wait();

        // Update off-chain database status
        const credential = await Credential.findOne({ credentialId });
        if (credential) {
            credential.status = 'Revoked';
            await credential.save();
        }

        res.status(200).json({ 
            message: 'Credential successfully revoked on the blockchain!',
            transactionHash: receipt.hash
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Blockchain error: Credential may not exist, is already revoked, or you are not the original issuer.' });
    }
};

// 5. HISTORY: Fetch all credentials issued by the logged-in institution
exports.getInstitutionHistory = async (req, res) => {
    try {
        // req.user.blockchainAddress is securely extracted from their JWT token
        const history = await Credential.find({ institutionAddress: req.user.blockchainAddress })
            .sort({ createdAt: -1 }); // Sort by newest first
            
        res.status(200).json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching credential history.' });
    }
};