// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CredentialRegistry {
    
    // The account that deploys this contract (The Regulatory Authority)
    address public admin;

    // Structure defining a University
    struct Institution {
        string name;
        bool isAuthorized;
        bool exists;
    }

    // Structure defining an Academic Credential
    struct Credential {
        string documentHash;      // The SHA-256 hash of the PDF
        address issuingInstitution;
        uint256 issuanceTimestamp;
        bool isRevoked;
        bool exists;
    }

    // Database mappings
    mapping(address => Institution) public institutions;
    mapping(string => Credential) public credentials;

    // Events
    event InstitutionRegistered(address indexed institutionAddress, string name);
    event InstitutionSuspended(address indexed institutionAddress);
    event CredentialIssued(string indexed credentialId, string documentHash, address indexed issuingInstitution);
    event CredentialRevoked(string indexed credentialId);

    // Modifier to restrict functions to only the Admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the network admin can perform this action");
        _;
    }

    // Modifier to restrict functions to only authorized universities
    modifier onlyAuthorizedInstitution() {
        require(institutions[msg.sender].isAuthorized, "Only authorized institutions can issue credentials");
        _;
    }

    // When the contract is first deployed, set the deployer as the admin
    constructor() {
        admin = msg.sender;
    }

    // --- GOVERNANCE FUNCTIONS ---

    function registerInstitution(address _institutionAddress, string memory _name) public onlyAdmin {
        require(!institutions[_institutionAddress].exists, "Institution is already registered");
        
        institutions[_institutionAddress] = Institution({
            name: _name,
            isAuthorized: true,
            exists: true
        });

        emit InstitutionRegistered(_institutionAddress, _name);
    }

    function suspendInstitution(address _institutionAddress) public onlyAdmin {
        require(institutions[_institutionAddress].exists, "Institution does not exist");
        institutions[_institutionAddress].isAuthorized = false;
        emit InstitutionSuspended(_institutionAddress);
    }

    // --- CREDENTIAL FUNCTIONS ---

    function issueCredential(string memory _credentialId, string memory _documentHash) public onlyAuthorizedInstitution {
        require(!credentials[_credentialId].exists, "A credential with this ID already exists");

        credentials[_credentialId] = Credential({
            documentHash: _documentHash,
            issuingInstitution: msg.sender,
            issuanceTimestamp: block.timestamp,
            isRevoked: false,
            exists: true
        });

        emit CredentialIssued(_credentialId, _documentHash, msg.sender);
    }

    function revokeCredential(string memory _credentialId) public {
        require(credentials[_credentialId].exists, "Credential does not exist");
        require(credentials[_credentialId].issuingInstitution == msg.sender, "Only the issuing institution can revoke this credential");
        require(!credentials[_credentialId].isRevoked, "Credential is already revoked");

        credentials[_credentialId].isRevoked = true;
        emit CredentialRevoked(_credentialId);
    }

    // --- VERIFICATION FUNCTIONS ---

    function verifyCredential(string memory _credentialId) public view returns (
        string memory documentHash,
        address issuingInstitution,
        uint256 issuanceTimestamp,
        bool isRevoked,
        bool exists
    ) {
        Credential memory cred = credentials[_credentialId];
        return (
            cred.documentHash,
            cred.issuingInstitution,
            cred.issuanceTimestamp,
            cred.isRevoked,
            cred.exists
        );
    }
}