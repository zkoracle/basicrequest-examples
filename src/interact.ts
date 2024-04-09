import fs from 'fs/promises';
import {
  OracleContract,
  // buildBasicRequestClient,
  buildOracleRequestTx,
  OracleRequest, BasicRequestClient, SErc677Contract,
} from '@zkoracle/opennautilus-contracts';
import {
  Toolkit
} from  '@zkoracle/utils'

import { JSONPath } from 'jsonpath-plus';

import {
  Encoding,
  Field,
  Lightnet,
  Mina,
  PrivateKey,
  Signature,
  UInt32,
  fetchAccount,
} from 'o1js';

const useCustomLocalNetwork = true;
const activeConfig = {
  network: {
    mina: 'http://localhost:8080/graphql',
    archive: 'http://localhost:8282',
    lightnetAccountManager: 'http://localhost:8181',
  },
  fee: Number('0.1') * 1e9, // in nanomina (1 billion = 1.0 mina)
};

// Network configuration
const network = Mina.Network(activeConfig.network);
Mina.setActiveInstance(network);

// Fee payer setup
const feePayerPrivateKey = useCustomLocalNetwork
  ? (await Lightnet.acquireKeyPair()).privateKey
  : PrivateKey.random();
const feePayerAccount = feePayerPrivateKey.toPublicKey();
if (!useCustomLocalNetwork) {
  console.log(`Funding the fee payer account.`);
  await Mina.faucet(feePayerAccount);
}
console.log(`Fetching the fee payer account information.`);
const accountDetails = (await fetchAccount({ publicKey: feePayerAccount }))
  .account;
console.log(
  `Using the fee payer account ${feePayerAccount.toBase58()} with nonce: ${
    accountDetails?.nonce
  } and balance: ${accountDetails?.balance}.`
);
console.log('');

const zkAppClientKeysBase58 = await Toolkit.initialZkAppKey(
  fs,
  'keys/basicRequestClient-zkApp.key'
);
console.log('Load basicRequestClient zkAppPrivateKey ...');
const zkAppClientPrivateKey = PrivateKey.fromBase58(
  zkAppClientKeysBase58.privateKey
);
const zkAppClientPublicKey = zkAppClientPrivateKey.toPublicKey();

const zkAppOracleKeysBase58 = await Toolkit.initialZkAppKey(
  fs,
  'keys/basicRequestOracle-zkApp.key'
);
console.log('Load basicRequestOracle zkAppPrivateKey ...');
const zkAppOraclePrivateKey = PrivateKey.fromBase58(
  zkAppOracleKeysBase58.privateKey
);
const zkAppOraclePublicKey = zkAppOraclePrivateKey.toPublicKey();

// ------

console.log('Build the contract ... (SErc677Contract)');
await SErc677Contract.compile();

console.log('Build the contract ... (OracleContract)');
await OracleContract.compile();

const zkOracle = new OracleContract(zkAppOraclePublicKey);

console.log('Build the contract ... (BasicRequestClient)');
await BasicRequestClient.compile();

const zkBasicRequestClient = new BasicRequestClient(zkAppClientPublicKey);

// const zkBasicRequestClient = await buildBasicRequestClient(
//   zkAppClientPublicKey,
//   zkAppOraclePublicKey
// );

if (process.argv[3] === 'deploy:oracle') {
  try {
    await Toolkit.deploy(
      activeConfig,
      feePayerPrivateKey,
      zkAppOraclePrivateKey,
      zkOracle,
      'Deploy zkOracle'
    );
  } catch (e) {
    console.log(e);
  }
}
if (process.argv[3] === 'deploy:client:basicreq') {
  try {
    await Toolkit.deploy(
      activeConfig,
      feePayerPrivateKey,
      zkAppClientPrivateKey,
      zkBasicRequestClient,
      'Deploy zkBasicRequestClient'
    );
  } catch (e) {
    console.log(e);
  }
}
if (process.argv[3] === 'operator:demo') {
  try {
    const events = await zkOracle.fetchEvents(UInt32.from(0));

    interface OracleData {
      sender: string;
      req0: string;
      req1: string;
      req2: string;
      req3: string;
    }

    // Reparse from jsonStringify (event.data)
    const r: OracleData = JSON.parse(JSON.stringify(events[1].event.data));

    const onOracleReq = [
      Field.fromJSON(r.req0),
      Field.fromJSON(r.req1),
      Field.fromJSON(r.req2),
      Field.fromJSON(r.req3),
    ];

    const onOracleDataBytes = Encoding.bytesFromFields(onOracleReq);
    const req2 = OracleRequest.fromBinary(onOracleDataBytes);

    const response = await fetch(req2.url);
    const data = await response.json();
    const result = JSONPath({ path: req2.path, json: data });

    console.log(`${JSON.stringify(events)} \r\n >> ${JSON.stringify(req2)} = ${result}`);
  } catch (e) {
    console.log(e);
  }
}
if (process.argv[3] === 'basicreq:demo') {
  try {
    // BasicRequest from Client to Oracle 'OracleRequest'
    let req1 = new OracleRequest({
      protocol: 'http',
      method: 'get',
      url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=MINA&tsyms=USD',
      path: 'RAW.MINA.USD.PRICE',
    });

    let tx = await buildOracleRequestTx(
      { sender: feePayerAccount, fee: activeConfig.fee },
      zkBasicRequestClient,
      req1
    );

    await tx.prove();
    tx.sign([feePayerPrivateKey, zkAppClientPrivateKey]);
    await tx.send();
  } catch (e) {
    console.log(e);
  }
}
