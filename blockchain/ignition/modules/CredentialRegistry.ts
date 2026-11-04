import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CredentialRegistryModule = buildModule("CredentialRegistryModule", (m) => {
  // This tells Hardhat to deploy our compiled CredentialRegistry.sol contract
  const registry = m.contract("CredentialRegistry");

  return { registry };
});

export default CredentialRegistryModule;