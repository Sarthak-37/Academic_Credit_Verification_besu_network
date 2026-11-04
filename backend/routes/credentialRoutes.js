const express = require('express');
const router = express.Router();
const multer = require('multer');
const credentialController = require('../controllers/credentialController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer to intercept PDFs and save them to the 'uploads/' folder
const upload = multer({ dest: 'uploads/' });

// Admin Route
router.post('/authorize', authMiddleware, credentialController.authorizeInstitution);

// Institution Route (Protected by Auth Middleware)
router.post('/issue', authMiddleware, upload.single('certificate'), credentialController.issueCredential);

// Public Route (No Auth required)
router.post('/verify', upload.single('certificate'), credentialController.verifyCredential);

// Institution Route (Protected by Auth Middleware)
router.post('/revoke', authMiddleware, credentialController.revokeCredential);

// Institution Route (Protected by Auth Middleware)
router.get('/history', authMiddleware, credentialController.getInstitutionHistory);

module.exports = router;