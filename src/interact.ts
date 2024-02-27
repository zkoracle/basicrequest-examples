import fs from 'fs/promises';
import { Toolkit, OracleContract } from "@zkoracle/opennautilus-contracts"

import { Mina, PrivateKey, Signature } from 'o1js';
// import { OracleContract } from '.js';

// Network configuration
let config = new Map([
  [
    "lightnet", {
      network: {
        mina: 'http://localhost:8080/graphql',
        archive: 'http://localhost:8282',
        lightnetAccountManager: 'http://localhost:8181'
      },
      fee: Number("0.1") * 1e9 // in nanomina (1 billion = 1.0 mina)
    }
  ],
  [
    "berkeley", {
      network: {
        mina: 'https://proxy.berkeley.minaexplorer.com/graphql',
        archive: 'https://api.minascan.io/archive/berkeley/v1/graphql/',
        // lightnetAccountManager: 'http://localhost:8181'
      },
      fee: Number("0.1") * 1e9 // in nanomina (1 billion = 1.0 mina)
    }
  ],
  [
    "testworld", {
      network: {
        mina: 'https://proxy.testworld.minaexplorer.com/graphql',
        archive: 'https://api.minascan.io/archive/testworld/v1/graphql/',
        // lightnetAccountManager: 'http://localhost:8181'
      },
      fee: Number("0.1") * 1e9 // in nanomina (1 billion = 1.0 mina)
    }
  ]
  
]);


const activeConfig = config.get(process.argv[2]) ;

if (activeConfig === undefined) {
  // console.log(commandLineUsage(sections));
  process.exit(1);
}

const network = Mina.Network(activeConfig.network);
Mina.setActiveInstance(network); 

let feePayerBase58 = await Toolkit.initialFeePayer(fs, process.argv[2]);

const feePayerPrivateKey = PrivateKey.fromBase58(feePayerBase58.privateKey);
const feePayerAccount = feePayerPrivateKey.toPublicKey();
console.log('Load feePayerPrivateKey ...');

const zkAppClientKeysBase58 = await Toolkit.initialZkAppKey(fs, 'keys/basicRequestClient-zkApp.key');
console.log('Load basicRequestClient zkAppPrivateKey ...');
const zkAppClientPrivateKey = PrivateKey.fromBase58(zkAppClientKeysBase58.privateKey);
const zkAppClientPublicKey = zkAppClientPrivateKey.toPublicKey();

const zkAppOracleKeysBase58 = await Toolkit.initialZkAppKey(fs, 'keys/basicRequestOracle-zkApp.key');
console.log('Load basicRequestOracle zkAppPrivateKey ...');
const zkAppOraclePrivateKey = PrivateKey.fromBase58(zkAppOracleKeysBase58.privateKey);
const zkAppOraclePublicKey = zkAppOraclePrivateKey.toPublicKey();

console.log('Build the contract ... (OracleContract)');
const zkAppOracle = new OracleContract(zkAppOraclePublicKey);  

await OracleContract.compile();

if(process.argv[3] === "deploy")
{
  try {
    await Toolkit.deploy(activeConfig, feePayerPrivateKey, 
      zkAppOraclePrivateKey, zkAppOracle, "Deploy zkAppOracle");

  } catch (e) {
    console.log(e);
  }

} 