
import Head from 'next/head';
import Image from 'next/image';
import { useEffect } from 'react';
import GradientBG from '../components/GradientBG.js';
import styles from '../styles/Home.module.css';
import heroMinaLogo from '../../public/assets/hero-mina-logo.svg';
import arrowRightSmall from '../../public/assets/arrow-right-small.svg';

type DataType = {
  Network: string;
  Answer: string;
  Last_Update: string;
  Cex_Comparison: string;
};

const data: DataType[] = [
  {
    Network: 'Network 1',
    Answer: 'Answer 1',
    Last_Update: 'Last update 1',
    Cex_Comparison: 'Cex comparison 1',
  },
  {
    Network: 'Network 1',
    Answer: 'Answer 1',
    Last_Update: 'Last update 1',
    Cex_Comparison: 'Cex comparison 1',
  },
  // Add more data here...
];

export default function Home() {
  useEffect(() => {
    (async () => {
      const { Mina, PublicKey } = await import('o1js');
      // const { Add } = await import('../../../contracts/build/src/');

      // Update this to use the address (public key) for your zkApp account.
      // To try it out, you can try this address for an example "Add" smart contract that we've deployed to
      // Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA.
      const zkAppAddress = '';
      // This should be removed once the zkAppAddress is updated.
      if (!zkAppAddress) {
        console.error(
          'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA'
        );
      }
      //const zkApp = new Add(PublicKey.fromBase58(zkAppAddress))
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Mina zkApp UI</title>
        <meta name="description" content="built with o1js" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <GradientBG>
        <main className={styles.main}>
          <div className={styles.center}>
            <a
              href="https://minaprotocol.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.logo}
                src={heroMinaLogo}
                alt="Mina Logo"
                width="191"
                height="174"
                priority
              />
            </a>
            <p className={styles.tagline}>
              built with
              <code className={styles.code}> o1js</code>
            </p>
          </div>

          <div className={styles.start}>
            <table style={{ border: '1px solid black', backgroundColor: 'white', width: '100%', tableLayout: 'fixed'}}>
              <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '10px' }}>Network</th>
                <th style={{ border: '1px solid black', padding: '10px' }}>Answer</th>
                <th style={{ border: '1px solid black', padding: '10px' }}>Last Update</th>
                <th style={{ border: '1px solid black', padding: '10px' }}>Cex Comparison</th>
              </tr>
              </thead>
              <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid black', padding: '10px' }}>{row.Network}</td>
                  <td style={{ border: '1px solid black', padding: '10px' }}>{row.Answer}</td>
                  <td style={{ border: '1px solid black', padding: '10px' }}>{row.Last_Update}</td>
                  <td style={{ border: '1px solid black', padding: '10px' }}>{row.Cex_Comparison}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          {/*<p className={styles.start}>*/}
          {/*  Get started by editing*/}
          {/*  <code className={styles.code}> src/pages/index.js</code> or <code className={styles.code}> src/pages/index.tsx</code>*/}
          {/*</p>*/}

          <div className={styles.grid}>
            <a
              href="https://docs.minaprotocol.com/zkapps"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>
                <span>DOCS</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Mina Logo"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>Explore zkApps, how to build one, and in-depth references</p>
            </a>
            <a
              href="https://docs.minaprotocol.com/zkapps/tutorials/hello-world"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>
                <span>TUTORIALS</span>
                <div>
                    <Image
                      src={arrowRightSmall}
                      alt="Mina Logo"
                      width={16}
                      height={16}
                      priority
                    />
                  </div>
                </h2>
                <p>Learn with step-by-step o1js tutorials</p>
              </a>
              <a
                href="https://discord.gg/minaprotocol"
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h2>
                  <span>QUESTIONS</span>
                  <div>
                    <Image
                      src={arrowRightSmall}
                      alt="Mina Logo"
                      width={16}
                      height={16}
                      priority
                    />
                  </div>
                </h2>
                <p>Ask questions on our Discord server</p>
              </a>
              <a
                href="https://docs.minaprotocol.com/zkapps/how-to-deploy-a-zkapp"
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h2>
                  <span>DEPLOY</span>
                  <div>
                    <Image
                      src={arrowRightSmall}
                      alt="Mina Logo"
                      width={16}
                      height={16}
                      priority
                    />
                  </div>
                </h2>
                <p>Deploy a zkApp to Testnet</p>
              </a>
            </div>
        </main>
      </GradientBG>
    </>
);
}
