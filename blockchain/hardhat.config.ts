import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

const DEV_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
        settings: { evmVersion: "istanbul" },
      },
      production: {
        version: "0.8.24",
        settings: { evmVersion: "istanbul" },
      },
    },
  },
  networks: {
    besu: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: [DEV_PRIVATE_KEY],
      gasPrice: 0
    },
  },
});