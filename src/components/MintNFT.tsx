import * as React from "react";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  Account,
  AuthorityType,
  createMint,
  createSetAuthorityInstruction,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";

window.Buffer = window.Buffer || require("buffer").Buffer;

const MintToken: React.FC = () => {
  const network = clusterApiUrl("devnet");
  const connection = new Connection(network, "confirmed");
  const fromWallet = Keypair.generate();
  const toWallet = new PublicKey(
    "5kRot8UnMEqoDkAc72e7pqaEaF5hxGmbDNowMmPiCDmb"
  );
  let fromTokenAccount: Account;
  let mint: PublicKey;

  const createToken = async () => {
    // Airdrop signature est
    const fromAirdropSignature = await connection.requestAirdrop(
      fromWallet.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(fromAirdropSignature);
    mint = await createMint(
      connection,
      fromWallet,
      fromWallet.publicKey,
      null,
      9 //9 here means that we have a decimal of 9 0's
    );
    console.log(`Create token: ${mint.toBase58()}`);

    // get the token account of the fromWallet address, and if it doesn't exist crete it
    fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      fromWallet.publicKey
    );
    console.log(`Create token account: ${fromTokenAccount.address.toBase58()}`);
  };

  const mintToken = async () => {
    // mint 1 token to the "fromTokenAccount" account we just created
    const signature = await mintTo(
      connection,
      fromWallet,
      mint,
      fromTokenAccount.address,
      fromWallet.publicKey,
      10_000_000_000
    );
    console.log(`Mint signature: ${signature}`);
  };

  const checkBalance = async () => {
    // get the supply of the token we minted
    const mintInfo = await getMint(connection, mint);
    console.log(`Mint info: ${mintInfo.supply}`);
    // get tokens left in the account
    const tokenAccountInfo = await getAccount(
      connection,
      fromTokenAccount.address
    );
    console.log(`Tokens left: ${tokenAccountInfo.amount}`);
  };

  const sendToken = async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      toWallet
    );
    console.log(`toTokenAccount: ${toTokenAccount.address}`);
    const signature = await transfer(
      connection,
      fromWallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet,
      10_000_000_000
    );
    console.log(`Signature: ${signature}`);
  };

  const lockNft = async () => {
    let transaction = new Transaction().add(
      createSetAuthorityInstruction(
        mint,
        fromWallet.publicKey,
        AuthorityType.MintTokens,
        null
      )
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet,]);

    console.log(`Lock Signature: ${signature}`);
  };

  return (
    <React.Fragment>
      <button onClick={createToken}>Create Token</button>
      <button onClick={mintToken}>Mint Token</button>
      <button onClick={checkBalance}>Check Balance</button>
      <button onClick={sendToken}>Send Token</button>
    </React.Fragment>
  );
};

export { MintToken };
