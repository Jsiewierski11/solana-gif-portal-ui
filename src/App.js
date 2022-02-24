import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import twitterLogo from './assets/twitter-logo.svg';
import idl from './idl.json';
import kp from './keypair.json';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const { SystemProgram, Keypair } = web3;
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = { preflightCommitment: 'processed' };

// test

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if(solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with public key: ',
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
        }
      } else {
          alert('Solana object not found! Get a Phantom Wallet 👻');
        }
    } catch(error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key: ', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const clearGifAccount = async () => {
    try {
      setGifList([]);
    } catch (error) {
      console.log("Error clearing GIF account")
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping')
      await program.rpc.startStuffOff({
      accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Create a new baseAccount with address: ", baseAccount.publicKey.toString())
      await getGifList();
    } catch (error) {
      console.log("Error creating baseAccount account: ", error)
    }
  }

  const sendGif = async () => {
    if (inputValue.length == null) {
      console.log("No GIF link given")
      return
    }
    console.log('Gif link: ', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      });
      console.log("GIF Succesfully sent to program ", inputValue)
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF ", error)
    }
  };

  const renderConnectedContainer = () => {
    if (gifList == null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do one-time initialization for GIF Program account
          </button>
        </div>
      )
    }
    else {
      return (
        <div className="connected-container">
          <input type="text" placeholder="Enter a gif link to add to the page!" value={inputValue} onChange={onInputChange} />
          <button className="cta-button-gif-button" onClick={sendGif}>Submit</button>
          <div className="connected-container">
              <button className="cta-button clear-gif-button" onClick={clearGifAccount}>Clear GIFS
              </button>
          </div>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
        )

    }
    
};

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect to Wallet.</button>
  );

  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account: ", account)
      setGifList(account.gifList)
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className={walletAddress ? 'authed-container' : 'container'}>
          <div className="header-container">
            <p className="header">🖼 The Lounge</p>
            <p className="sub-text">
              Jarid's Solana lounge in the metaverse ✨
            </p>
          </div>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Project from @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
