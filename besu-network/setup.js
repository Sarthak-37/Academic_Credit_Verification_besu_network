const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const networkDir = path.join(__dirname, "network");
const tempDir = path.join(__dirname, "network_temp");
const validatorHosts = [
  "172.31.240.11",
  "172.31.240.12",
  "172.31.240.13",
  "172.31.240.14",
];
const rpcNodeHost = "172.31.240.15";

console.log("0. Cleaning up old files...");
// Remove both folders if they exist from previous failed runs
if (fs.existsSync(networkDir))
  fs.rmSync(networkDir, { recursive: true, force: true });
if (fs.existsSync(tempDir))
  fs.rmSync(tempDir, { recursive: true, force: true });

console.log("1. Generating blockchain genesis file and keys via Docker...");
const projectDir = __dirname.replace(/\\/g, "/");
// Bypass the image entrypoint, whose permission preflight creates the --to directory.
execSync(
  `docker run --rm --entrypoint /opt/besu/bin/besu -v "${projectDir}:/data" hyperledger/besu:latest operator generate-blockchain-config --config-file=/data/qbft-config.json --to=/data/network_temp --private-key-file-name=key`,
  { stdio: "inherit" },
);

console.log("2. Moving files to final network folder...");
fs.renameSync(tempDir, networkDir);

console.log("3. Organizing and renaming validator keys...");
const keysDir = path.join(networkDir, "keys");
const folders = fs.readdirSync(keysDir);
const staticNodes = [];
let n = 1;
for (const folder of folders) {
  const oldPath = path.join(keysDir, folder);
  if (fs.statSync(oldPath).isDirectory()) {
    const publicKey = fs.readFileSync(path.join(oldPath, "key.pub"), "utf8").trim();
    if (!/^0x[0-9a-fA-F]{128}$/.test(publicKey)) {
      throw new Error(`Unexpected public key format in ${path.join(oldPath, "key.pub")}`);
    }

    staticNodes.push(
      `enode://${publicKey.slice(2)}@${validatorHosts[n - 1]}:30303`,
    );
    const newPath = path.join(keysDir, `validator${n}`);
    fs.renameSync(oldPath, newPath);
    console.log(`-> Assigned keys to validator${n}`);
    n++;
  }
}

if (n - 1 !== validatorHosts.length) {
  throw new Error(`Expected ${validatorHosts.length} validator key directories, found ${n - 1}`);
}

const rpcNodeKeysDir = path.join(keysDir, "rpcnode");
fs.mkdirSync(rpcNodeKeysDir);
const rpcNodeKeyPair = crypto.createECDH("secp256k1");
rpcNodeKeyPair.generateKeys();
const rpcNodePublicKey = rpcNodeKeyPair.getPublicKey().subarray(1).toString("hex");
fs.writeFileSync(path.join(rpcNodeKeysDir, "key"), `${rpcNodeKeyPair.getPrivateKey().toString("hex")}\n`);
fs.writeFileSync(path.join(rpcNodeKeysDir, "key.pub"), `0x${rpcNodePublicKey}\n`);
staticNodes.push(`enode://${rpcNodePublicKey}@${rpcNodeHost}:30303`);

console.log("4. Creating the Address Book (static-nodes.json)...");
const staticNodesPath = path.join(networkDir, "static-nodes.json");
fs.writeFileSync(staticNodesPath, JSON.stringify(staticNodes, null, 2));

console.log("5. Enforcing Node Permissioning (permissions_config.toml)...");
// Create a strict allowlist so ONLY our consortium nodes can connect
const tomlContent = `nodes-allowlist=[\n  "${staticNodes.join('",\n  "')}"\n]`;
const permissionsPath = path.join(networkDir, "permissions_config.toml");
fs.writeFileSync(permissionsPath, tomlContent);

console.log("\n✅ Setup complete! The network files are ready.");