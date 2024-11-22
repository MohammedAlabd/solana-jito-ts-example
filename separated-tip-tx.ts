require("dotenv").config();

import * as Fs from "fs";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

import { searcher, bundle } from "jito-ts";
import { SystemProgram } from "@solana/web3.js";

const getRandomeTipAccountAddress = async (
  searcherClient: searcher.SearcherClient,
) => {
  const account = await searcherClient.getTipAccounts();
  return new PublicKey(account[Math.floor(Math.random() * account.length)]);
};

const MEMO_PROGRAM_ID = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo";

const buildMemoTransaction = (
  keypair: Keypair,
  message: string,
  recentBlockhash: string,
  tipIx?: TransactionInstruction,
): VersionedTransaction => {
  const ix = new TransactionInstruction({
    keys: [
      {
        pubkey: keypair.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(message),
  });

  const instructions = [ix];

  if (tipIx) instructions.push(tipIx);

  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: recentBlockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  tx.sign([keypair]);

  console.log("txn signature is: ", bs58.encode(tx.signatures[0]));
  return tx;
};

const main = async () => {
  const blockEngineUrl = process.env.BLOCK_ENGINE_URL || "";
  console.log("BLOCK_ENGINE_URL:", blockEngineUrl);

  const authKeypairPath = process.env.AUTH_KEYPAIR_PATH || "";
  console.log("AUTH_KEYPAIR_PATH:", authKeypairPath);
  const decodedKey = new Uint8Array(
    JSON.parse(Fs.readFileSync(authKeypairPath).toString()) as number[],
  );
  const keypair = Keypair.fromSecretKey(decodedKey);

  const bundleTransactionLimit = parseInt(
    process.env.BUNDLE_TRANSACTION_LIMIT || "5",
  );

  // Create the searcher client that will interact with Jito
  const searcherClient = searcher.searcherClient(blockEngineUrl);
  // Subscribe to the bundle result
  searcherClient.onBundleResult(
    (result) => {
      console.log("received bundle result:", result);
    },
    (e) => {
      throw e;
    },
  );

  // Get a random tip account address
  const tipAccount = await getRandomeTipAccountAddress(searcherClient);
  console.log("tip account:", tipAccount);

  const rpcUrl = process.env.RPC_URL || "";
  console.log("RPC_URL:", rpcUrl);

  // get the latest blockhash
  const connection = new Connection(rpcUrl, "confirmed");
  const blockHash = await connection.getLatestBlockhash();

  // Build and sign a tip transaction
  const tipIx = SystemProgram.transfer({
    fromPubkey: keypair.publicKey,
    toPubkey: tipAccount,
    lamports: 1000, // tip amount
  });
  const tipTx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: keypair.publicKey,
      recentBlockhash: blockHash.blockhash,
      instructions: [tipIx],
    }).compileToV0Message(),
  );
  tipTx.sign([keypair]);

  const transactions = [
    buildMemoTransaction(keypair, "jito test 1", blockHash.blockhash),
    buildMemoTransaction(keypair, "jito test 2", blockHash.blockhash),
  ];

  const jitoBundle = new bundle.Bundle(
    [...transactions, tipTx],
    bundleTransactionLimit,
  );

  try {
    const resp = await searcherClient.sendBundle(jitoBundle);
    console.log("resp:", resp);
  } catch (e) {
    console.error("error sending bundle:", e);
  }
};

main()
  .then(() => {
    console.log("Sending bundle");
  })
  .catch((e) => {
    throw e;
  });
