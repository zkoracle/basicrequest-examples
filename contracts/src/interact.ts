import fs from 'fs/promises';
import {
  OracleContract,
  // buildBasicRequestClient,
  buildOracleRequestTx,
  buildTransferAndCallTx,
  OracleRequest, BasicRequestClient, SErc677Contract, IOracleData,
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
  fetchAccount, TokenId, UInt64, AccountUpdate,
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
SErc677Contract.staticSymbol = "PRC"
SErc677Contract.staticName = "PRICE"
SErc677Contract.staticDecimals = 9
await SErc677Contract.compile();

const zkErc677KeysBase58 = await Toolkit.initialZkAppKey(
  fs,
  'keys/erc677Token-zkApp.key'
);
console.log('Load Erc677 Token zkAppPrivateKey ...');
const zkErc677PrivateKey = PrivateKey.fromBase58(
  zkErc677KeysBase58.privateKey
);
const zkErc677PublicKey = zkErc677PrivateKey.toPublicKey();

const serc677TokenPrivateKey = zkErc677PrivateKey;
const serc677TokenAddress = serc677TokenPrivateKey.toPublicKey();

const zkAppSErc677 = new SErc677Contract(zkErc677PublicKey);
const tokenSErc677Id = TokenId.derive(zkErc677PublicKey);

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

if (process.argv[3] === 'setup:basicrequest') {
  try {

    // await Toolkit.deploy(
    //   activeConfig,
    //   feePayerPrivateKey,
    //   serc677TokenPrivateKey,
    //   zkAppSErc677,
    //   'Deploy zkErc677Token'
    // );
    //
    // await Toolkit.deploy(
    //   activeConfig,
    //   feePayerPrivateKey,
    //   zkAppOraclePrivateKey,
    //   zkOracle,
    //   'Deploy zkOracle'
    // );
    //
    // await Toolkit.deploy(
    //   activeConfig,
    //   feePayerPrivateKey,
    //   zkAppClientPrivateKey,
    //   zkBasicRequestClient,
    //   'Deploy zkBasicReqClient'
    // );
    //
    // console.log("======== SETUP ========");
    //
    // // Set OracleContract on Client
    // const txnSetup = await Mina.transaction({ sender: feePayerAccount, fee: activeConfig.fee }, async () => {
    //   await zkBasicRequestClient.setErc677Token(serc677TokenAddress);
    //   await zkBasicRequestClient.setOracleContract(zkAppOraclePublicKey);
    // });
    //
    // await txnSetup.prove();
    // txnSetup.sign([feePayerPrivateKey, zkAppClientPrivateKey]);
    // await txnSetup.send();

    await fetchAccount({ publicKey: zkAppClientPublicKey });

    const tokenAddr = zkBasicRequestClient.tokenAddress.get();
    const oracleAddr = zkBasicRequestClient.oracleAddress.get();

    console.log(`tokenAddr: ${JSON.stringify(tokenAddr)}`);
    console.log(`oracleAddr: ${JSON.stringify(oracleAddr)}`);

    // Mint
    const txnMint = await Mina.transaction({ sender: feePayerAccount, fee: activeConfig.fee }, async() => {
      // AccountUpdate.fundNewAccount(feePayerAccount);
      await zkAppSErc677.mint(feePayerAccount, UInt64.from(500_000));
    });

    await txnMint.prove();
    txnMint.sign([feePayerPrivateKey, serc677TokenPrivateKey, zkAppOraclePrivateKey]);
    await txnMint.send();

    await fetchAccount({ publicKey: zkErc677PublicKey });

    console.log("--------------------------");
    console.log(`Balance= ${JSON.stringify(await zkAppSErc677.balanceOf(feePayerAccount))}`);

    // BasicRequest from Client to Oracle 'OracleRequest'
    let req1 = new OracleRequest({
      protocol: 'http',
      method: 'get',
      url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC&tsyms=USD',
      path: 'RAW.BTC.USD.PRICE',
    });

    let tx = await buildTransferAndCallTx(
      { sender: feePayerAccount, fee: Number('0.2') * 1e9 }, feePayerAccount,
      zkBasicRequestClient,
      req1
    );

    await tx.prove();
    tx.sign([feePayerPrivateKey, zkAppClientPrivateKey]);
    await tx.send();

    await Toolkit.displayEvents(zkOracle, UInt32.from(0));


  } catch (e) {
    console.log(e);
  }
}
if (process.argv[3] === 'display:events') {

  await Toolkit.displayEvents(zkOracle, UInt32.from(0));

  const events = await zkOracle.fetchEvents(UInt32.from(0));
  console.log(events);
  const s = await zkAppSErc677.fetchEvents(UInt32.from(0));
  console.log(s);

}
if (process.argv[3] === 'operator:demo') {
  try {
    const events = await zkOracle.fetchEvents(UInt32.from(0));

    console.log(events);

    // const eventsOracle = await zkOracle.fetchEvents(UInt32.from(0));

    //
    // // interface IOracleData {
    // //   sender: string;
    // //   req0: string;
    // //   req1: string;
    // //   req2: string;
    // //   req3: string;
    // // }
    //
    // // Reparse from jsonStringify (event.data)
    // const r: IOracleData = JSON.parse(JSON.stringify(events[1].event.data));
    //
    // const onOracleReq = [
    //   Field.fromJSON(r.req0),
    //   Field.fromJSON(r.req1),
    //   Field.fromJSON(r.req2),
    //   Field.fromJSON(r.req3),
    // ];
    //
    // const onOracleDataBytes = Encoding.bytesFromFields(onOracleReq);
    // const req2 = OracleRequest.fromBinary(onOracleDataBytes);
    //
    // const response = await fetch(req2.url);
    // const data = await response.json();
    // const result = JSONPath({ path: req2.path, json: data });
    //
    // console.log(`${JSON.stringify(events)} \r\n >> ${JSON.stringify(req2)} = ${result}`);
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
