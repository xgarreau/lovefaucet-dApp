import './App.css';
import React from 'react';
import {ethers} from "ethers";
import loveFaucetContractAbi from "./abi.json";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

let loveFaucetContractAddr = "0x181FFF78c7Ea1160E7A8b5CBFBEF3469C647bB41";

// Reload page if network or wallet is changed
if (window.ethereum) {
  window.ethereum.on('chainChanged', function (networkId) {
      window.location.reload();
  });
}

class MyLoginButton  extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          disabled: props.disabled,
          label: props.label,
          afterLabel: props.afterLabel
      };

      this.handleClick = this.handleClick.bind(this);
  }
  
  async handleClick() {
      const oldLabel = this.state.label;
      
      this.setState({
          label: "💗",
          disabled: "disabled"
      });
      
      await this.props.clickHandler();

      this.setState({
          label: oldLabel,
          disabled: ""
      });
  }
      
  render () {
      return (
          <div className="MyButton">
              <button onClick={this.handleClick} disabled={this.state.disabled}>{this.state.label}</button>{this.state.afterLabel}
          </div>
      );
  }
}

class MyClaimButton extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          disabled: props.disabled,
          label: props.label,
          afterLabel: props.afterLabel
      };

      this.handleClick = this.handleClick.bind(this);
  }
  
  async handleClick() {
      const oldLabel = this.state.label;
      
      this.setState({
          label: "💗",
          disabled: "disabled"
      });
      
      await this.props.clickHandler();

      this.setState({
          label: oldLabel,
          disabled: ""
      });
  }

  render () {
      return (
          <div className="MyButton">
              <button onClick={this.handleClick} disabled={this.state.disabled}>{this.state.label}</button>{this.state.afterLabel}
          </div>
      );
  }
}

class UserPane extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          isLoggedIn: false,
          hasClaimed: false,
          address: null,
          balance: null,
          isYumaTestnet: true,
          userMessage: ""
      };

      this.tryLogin = this.tryLogin.bind(this);
      this.tryClaim = this.tryClaim.bind(this);
  }
  
  // Allow login
  async tryLogin() {
      if (!this.state.isLoggedIn) {
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
          if (!ethProvider) {
              console.error("Please install MetaMask !");
              return;
          }

          const currNetwork = await ethProvider.getNetwork();
          const isYumaTestnet = (currNetwork.chainId.toString() === "1662");

          if (!isYumaTestnet) {
              console.error('Please switch to Yuma Network and reload');
              this.setState({
                  isYumaTestnet: isYumaTestnet,
              });
              return;
          }

          try {
              await ethProvider.send('eth_requestAccounts', []);
              const signer = await ethProvider.getSigner();
      
              const signerAddress = await signer.getAddress();
              const signerBalance = await signer.getBalance();
      
              const LoveFaucet = new ethers.Contract(loveFaucetContractAddr, loveFaucetContractAbi, signer);
              const userCanClaim = await LoveFaucet.canClaim();
              const dropAmount = await LoveFaucet.dropAmount();
              const faucetBalance = await LoveFaucet.balance();
              
              console.log(dropAmount);
              console.log(faucetBalance);

              if (!userCanClaim) {
                  this.setState({
                      isLoggedIn: true,
                      hasClaimed: true,
                      userMessage: "You already claimed in the last 24h",
                      address: signerAddress,
                      balance: signerBalance
                  });            
              } else if (signerBalance.eq(0)) {        
                this.setState({
                  isLoggedIn: true,
                  hasClaimed: true,
                  userMessage: "You need some testnet $ZEN for the gas",
                  address: signerAddress,
                  balance: signerBalance
                });            
              } else if (faucetBalance.lt(dropAmount)) {
                this.setState({
                  isLoggedIn: true,
                  hasClaimed: true,
                  userMessage: "There is not enough $LOVE in the Faucet",
                  address: signerAddress,
                  balance: signerBalance
                });            
              } else {
                  this.setState({
                      isLoggedIn: true,
                      address: signerAddress,
                      balance: signerBalance
                  });
              }

              window.ethereum.on('accountsChanged', function (accounts) {
                  window.location.reload();
              });
              
              toast("Logged in !", {
                position: toast.POSITION.TOP_CENTER
              });
          } catch (error) {
              console.log(error);
          }
      }
  }

  // Permet de Claim le Drop 
  async tryClaim() {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      if (!ethProvider) {
          this.setState({userMessage: "Please install MetaMask !"});
          return;
      }

      const signer = await ethProvider.getSigner();

      const LoveFaucet = new ethers.Contract(loveFaucetContractAddr, loveFaucetContractAbi, signer);
      try {
          await LoveFaucet.getLove();
          this.setState({
              userMessage: "OK ! Check your wallet ;)",
              hasClaimed: true
          });
          toast("Love claimed !", {
            position: toast.POSITION.TOP_CENTER
          });
      } catch (error) {
          this.setState({userMessage: "Claim cancelled"});
          console.log(error);
      }      
  }

  render () {
      if (!window.ethereum) {
          console.error("Please install MetaMask !");
          return <div className="header-message">Please install MetaMask !</div>;
      }
      if (!this.state.isYumaTestnet) {
          return <div className="header-message">Please switch to Yuma Network</div>;
      }
      if (!this.state.isLoggedIn) {
          return <MyLoginButton clickHandler={this.tryLogin} isDisabled={false} label="Connect Metamask" afterLabel="" />;
      } else {
          if (!this.state.hasClaimed) {
              return <div>
              <MyClaimButton clickHandler={this.tryClaim}  isDisabled={false} label="Claim my daily $LOVE drop" afterLabel="" />
              <p className="signerAddress">Addr : {this.state.address}</p>
              <p className="userMessage">{this.state.userMessage}</p>
              </div>;
          } else {
              return <div>
                  <p className="signerAddress">Addr : {this.state.address}</p>
                  <p className="userMessage">{this.state.userMessage}</p>
              </div>;
          }
      }
  }
}

function App() {
  return (
    <div className="App">
      <ToastContainer />
      <header className="App-header">
        <h1>The LOVE faucet</h1>
        <img src="https://ipfs.io/ipfs/QmQT8XQn9Uf3azbti6FC4XT89bMwx7fd6AH7nYXtCjKZ3q/LOVE" className="App-logo" alt="logo" />
        <UserPane />
      </header>
    </div>
  );
}

export default App;
