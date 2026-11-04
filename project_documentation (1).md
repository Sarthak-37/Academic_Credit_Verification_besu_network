# Decentralized Academic Credential Verification System

An enterprise-grade, full-stack blockchain application designed to issue, manage, and cryptographically verify academic credentials. 

## System Architecture
This project utilizes a hybrid architecture, storing heavy document data off-chain while anchoring cryptographic proofs on-chain for immutable verification.
- **Frontend:** React, Vite, and Tailwind CSS v4.
- **Backend:** Node.js, Express, and Ethers.js.
- **Off-Chain Database:** MongoDB (manages user accounts, institutional metadata, and PDF storage).
- **Smart Contract:** Solidity (`CredentialRegistry.sol`).
- **Blockchain Network:** Hyperledger Besu (4-node local private network).

## Why Hyperledger Besu?
Public blockchains like Ethereum are built for anonymity and require expensive gas fees (Proof of Stake/Work). Academic records require strict privacy, known identities, and zero-fee issuance. 

Hyperledger Besu was selected for this infrastructure because:
1. **Permissioned Network:** It allows us to build a private network where only authorized institutional nodes can write data. 
2. **EVM Compatibility:** It runs the exact same Ethereum Virtual Machine, allowing us to write smart contracts in standard Solidity and compile them using Hardhat.
3. **QBFT Consensus:** We utilized a 4-node Quorum Byzantine Fault Tolerance (QBFT) consensus mechanism. QBFT provides immediate block finality (no waiting for block confirmations) and operates without mining, making the infrastructure highly energy-efficient and suitable for institutional deployments.

## Entities Involved
1. **Network Administrator:** The owner of the smart contract. Responsible for governance, including reviewing and explicitly authorizing registered universities to interact with the blockchain.
2. **Institutions (Universities):** Authorized entities that log into the dashboard to issue cryptographic credentials for their students and revoke them if academic misconduct occurs.
3. **Students:** The recipients of the credentials. Their data (email, unique credential ID) is anchored to the hash of their physical PDF certificate.
4. **Public Verifiers (Employers):** Third parties who use the public portal to upload a candidate's PDF certificate. The system recalculates the SHA-256 hash and compares it against the blockchain record to instantly verify authenticity and check for revocation.

## Core Features & Supported Functions

### Off-Chain (Node.js & MongoDB)
- **Role-Based Access Control (RBAC):** JWT-based authentication separating Admins, Institutions, and Public users.
- **Document Management:** Intercepts uploaded PDFs via Multer, stores them locally, and computes a secure SHA-256 hash using Node's native `crypto` module before interacting with the blockchain.
- **Audit Logging:** Maintains an off-chain relational history of all issued credentials for fast dashboard rendering.

### On-Chain (Solidity Smart Contract)
- `registerInstitution(address _institution, string _name)`: Admin-only function to whitelist a university's wallet address.
- `issueCredential(string _credentialId, string _documentHash)`: Authorized institutions map a unique student ID to a document hash. Reverts if the ID already exists or the caller is unauthorized.
- `verifyCredential(string _credentialId)`: A public, read-only function that returns the stored hash, issuer address, issuance timestamp, and revocation status for a given ID.
- `revokeCredential(string _credentialId)`: Allows the original issuing institution to flag a credential as permanently invalid.

---

## Complete Setup Instructions

### Prerequisites
- **Docker Desktop:** Installed and running.
- **Node.js:** v18.0 or higher.
- **MongoDB:** Community Server running locally on port `27017`.
- **Git & PowerShell/Terminal:** For executing commands.

### Step 1: Start the Blockchain Network
Spin up the 4-node Hyperledger Besu infrastructure using Docker.
```bash
cd besu-network/network
docker-compose up -d
```
*The RPC node will be exposed at `http://127.0.0.1:8545`.*

### Step 2: Compile & Deploy the Smart Contract
Compile the Solidity registry using the "Paris" EVM target and deploy it to the local Besu network.
```bash
cd blockchain
npx hardhat clean
npx hardhat compile
npx hardhat ignition deploy ./ignition/modules/CredentialRegistry.ts --network besu
```
*Note: Copy the deployed contract address output in the terminal. You will need it for the backend configuration.*

### Step 3: Configure and Start the Backend API
Set up the Node.js server that bridges the MongoDB database and the blockchain.
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/academic_credentials
JWT_SECRET=your_super_secret_jwt_key
BESU_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ADDRESS>
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
Start the server:
```bash
node server.js
```
*The server will run on `http://localhost:5000`. Ensure the terminal indicates successful connections to both MongoDB and the Besu network.*

### Step 4: Start the React Frontend
Launch the Vite development server to interact with the UI.
```bash
cd frontend
npm install
npm run dev
```
*Access the application at `http://localhost:5173`.*

### Step 5: Shutting Down the System
To safely halt the application and preserve your blockchain state:
1. Press `Ctrl + C` in the terminals running the Frontend and Backend servers.
2. Navigate to the Besu network directory and stop the Docker containers:
```bash
cd besu-network/network
docker-compose down
```