# Mina zkApp: zkOracle/BasicRequest

## BasicRequest: Building, Fetching and Parsing Oracle Requests

This document explains the components of the BasicRequestClient and OracleContract, focusing on how it builds Oracle requests in Protobuf format and encodes them for transaction submission, as well as how to parse those requests from the on-chain state.

### Building the Request

```typescript
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

```

### Fetching the Request with JSON

```typescript
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

```

### Parsing the Request and Offchain Processing.

```typescript
    const onOracleReq = [
        Field.fromJSON(r.req0),
        Field.fromJSON(r.req1),
        Field.fromJSON(r.req2),
        Field.fromJSON(r.req3),
    ];

    const onOracleDataBytes = Encoding.bytesFromFields(onOracleReq);
    const req2 = OracleRequest.fromBinary(onOracleDataBytes);

    // expect(ReqField).toEqual(onOracleReq);
    // expect(req1).toEqual(req2);

    const response = await fetch(req2.url);
    const data = await response.json();
    const result = JSONPath({ path: req2.path, json: data });

```

## Summary

This code demonstrates how the BasicRequestClient and OracleContract interacts with the Mina blockchain to perform off-chain computations and store relevant data on-chain securely. Building requests with Protobuf and encoding them ensures efficient data handling, while parsing from the on-chain state allows verification and further processing.


## Building the Request

### How to build

```sh
pnpm run build
```

### How to demo

```sh
pnpm run lightnet:up
pnpm run lightnet:deploy:oracle
pnpm run lightnet:deploy:client:basicreq

```

```sh
pnpm run lightnet:basicreq:demo
pnpm run lightnet:operator:demo

[{"blockHeight":"12","blockHash":"3NL3EtmWUnAnvb3UwqB5e2MdnwQktwMLz48nU1vE4dqtEHzkvrkH","parentBlockHash":"3NLKfq7eioa1XianarroTWJB2Qun2BVKq3hJxYZYWLUdXRaNNPxH","globalSlot":"23","chainStatus":"canonical","event":{"data":{"sender":"B62qp5eJC9H1g9UDdaPrmUr5AKe3gjjiMGbddFtLSvuk9MfaRYasAn8","req0":"202105089534635679287542102129634014098290637890342538615278857583122187274","req1":"186322468418739161443975675705270205917780742321009757922220809732710756473","req2":"122232280196080261705981788728449916648225878492310853900744626485116826982","req3":"100663972473015221515207985236"},"transactionInfo":{"transactionHash":"5JtX67ECmj9eRSBXEhbmhGLs7YnzUQAQ559EoXHLHmQDv2JRQ8A3","transactionStatus":"applied","transactionMemo":"E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH"}},"type":"OracleRequest"},{"blockHeight":"33","blockHash":"3NKkzp9kAdHznNUVcnZeFTKvfhTFgJ2bMPYPbBqug4H2BRRjtdKg","parentBlockHash":"3NKRBqE4WJSzSSj6RTAa8UJvF5BhGs1CvkGR8eT4brRdrrSVSXf2","globalSlot":"55","chainStatus":"canonical","event":{"data":{"sender":"B62qmfGUoNbxmumzH3SiDYwrxjY62BvgnRNF1zUTnzsnBmG7u5S5nxz","req0":"202105089534635679287542102129634014098290637969570701129543195176666137610","req1":"186322468418739161443975675705270205917780742321009757922220809732710756473","req2":"81877177951577575111301162870804740664752209796222796926772275623395882342","req3":"6597114099991525557220670402611533"},"transactionInfo":{"transactionHash":"5Jv8wZ3bhvXE6PQ4ZEdRbXAPSMUpTbnDxGUMtBBYcVEERZsteb7x","transactionStatus":"applied","transactionMemo":"E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH"}},"type":"OracleRequest"}]

 >> {"protocol":"http","method":"get","url":"https://min-api.cryptocompare.com/data/pricemultifull?fsyms=MINA&tsyms=USD","path":"RAW.MINA.USD.PRICE"} = 1.34633725275986

```

### How to run tests

```sh
pnpm run test
pnpm run testw # watch mode
```

### How to run coverage

```sh
pnpm run coverage
```

## License

[Apache-2.0](LICENSE)
