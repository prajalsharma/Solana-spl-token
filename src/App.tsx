import React from 'react';
import logo from './logo.svg';
import './App.css';
import { MintToken } from './components/MintToken';
import SendSol from './components/WrapSOL';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          <code>Mint Token</code>
        </p>
       <MintToken />
       <SendSol />
      </header>
    </div>
  );
}

export default App;
