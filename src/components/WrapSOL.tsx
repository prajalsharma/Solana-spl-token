import {
    closeAccount,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
  transfer,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as React from "react";

const SendSol = () => {
  const network = clusterApiUrl("devnet");
  const connection = new Connection(network, "confirmed");
  const fromWallet = Keypair.generate();
  let associatedTokenAccount: PublicKey;
  const wrapSol = async () => {
    const airdropSignature = await connection.requestAirdrop(
      fromWallet.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);
    // getting the associated token account
    associatedTokenAccount = await getAssociatedTokenAddress(
      NATIVE_MINT,
      fromWallet.publicKey
    );
    // create token account to hold the wrap SOL

    const ataTransaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        fromWallet.publicKey,
        associatedTokenAccount,
        fromWallet.publicKey,
        NATIVE_MINT
      )
    );
    await sendAndConfirmTransaction(connection, ataTransaction, [fromWallet]);
    // Transfer SOL to associated token account and use syncNative to update wrapped SOL balance
    const solTransferTranasaction = new Transaction().add(
      SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: associatedTokenAccount,
          lamports: LAMPORTS_PER_SOL //this is the SOL that we are sending 

      }),
      createSyncNativeInstruction(associatedTokenAccount),
  );
  

    await sendAndConfirmTransaction(
        connection,
        solTransferTranasaction,
        [fromWallet]
    );

    const accountInfo = await getAccount(connection, associatedTokenAccount);

    console.log(`Native: ${accountInfo.isNative}, Lamports: ${accountInfo.amount}`);

  };

  const unwrapSol = async () => {
    // got the balance
    const walletBalance = await connection.getBalance(fromWallet.publicKey);
    console.log(`Before unwrapping sol: ${walletBalance}`);
    await closeAccount(
        connection, 
        fromWallet,
        associatedTokenAccount,
        fromWallet.publicKey,
        fromWallet
    );
    const walletClosedBalance = await connection.getBalance(fromWallet.publicKey);
    console.log(`Balance aftre sending ${walletClosedBalance}`);
  };

  const sendSol = async () => {
    // airdrop SOL into our account
    const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
    // confirm the transaction
    await connection.confirmTransaction(fromAirdropSignature);
    // declare the wallet that will recieved the wrapped SOL
    const toWallet = new PublicKey("5kRot8UnMEqoDkAc72e7pqaEaF5hxGmbDNowMmPiCDmb");
    // get the token account to the toWallet address if it does't exist then create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        NATIVE_MINT,
        fromWallet.publicKey,
    );

 const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        NATIVE_MINT,
        toWallet,
    );

    const signature = await transfer(
        connection,
        fromWallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        LAMPORTS_PER_SOL
    );
    console.log(`TXN: ${signature}`);
  };

  return (
    <React.Fragment>
        Wrap and Send Sol
        <button onClick={wrapSol}>wrapSol</button>
        <button onClick={unwrapSol}>unwrapSol</button>
        <button onClick={sendSol}>sendSol</button>
    </React.Fragment>
  );
};

export default SendSol;
