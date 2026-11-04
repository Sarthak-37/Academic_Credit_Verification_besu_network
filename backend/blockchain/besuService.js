const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const contractJsonPath = path.join(__dirname, 'CredentialRegistry.json');
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
const abi = contractJson.abi;

const provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL);
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

const credentialRegistryContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    adminWallet // Connected as Admin by default
);

// NEW: Function to connect to the contract using a specific University's private key
const getInstitutionContract = (institutionPrivateKey) => {
    const institutionWallet = new ethers.Wallet(institutionPrivateKey, provider);
    return new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, institutionWallet);
};

const checkBlockchainConnection = async () => {
    try {
        const network = await provider.getNetwork();
        console.log(`Besu Blockchain Connected: Chain ID ${network.chainId}`);
        const adminAddress = await credentialRegistryContract.admin();
        console.log(`Smart Contract Loaded. Admin is: ${adminAddress}`);
    } catch (error) {
        console.error(`Blockchain connection error: ${error.message}`);
    }
};

module.exports = {
    provider,
    adminWallet,
    credentialRegistryContract,
    getInstitutionContract,
    checkBlockchainConnection
};