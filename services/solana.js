const { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Keypair } = require('@solana/web3.js');
const axios = require('axios');
const bs58 = require('bs58');

let connection;

function getConnection() {
  if (!connection) {
    connection = new Connection(
      process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }
  return connection;
}

async function getTokenBalance(walletAddress) {
  try {
    const tokenCA = process.env.TOKEN_CA;
    if (!tokenCA) return 0;
    const conn = getConnection();
    const pubkey = new PublicKey(walletAddress);
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
      mint: new PublicKey(tokenCA),
    });
    if (!tokenAccounts.value.length) return 0;
    return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
  } catch (err) {
    console.error('[Solana] getTokenBalance error:', err.message);
    return 0;
  }
}

async function getTokenPrice() {
  try {
    const tokenCA = process.env.TOKEN_CA;
    const apiKey = process.env.SOLANATRACKER_API_KEY;
    if (!tokenCA || !apiKey) return 0;
    const resp = await axios.get(
      `https://data.solanatracker.io/price?token=${tokenCA}`,
      { headers: { 'x-api-key': apiKey }, timeout: 8000 }
    );
    return resp.data.price || 0;
  } catch (err) {
    console.error('[Solana] getTokenPrice error:', err.message);
    return 0;
  }
}

async function checkHolding(walletAddress) {
  const [tokenBalance, price] = await Promise.all([
    getTokenBalance(walletAddress),
    getTokenPrice(),
  ]);
  const solValue = price > 0 ? tokenBalance * price : 0;
  return {
    qualified: solValue >= 1,
    solValue,
    tokenBalance,
    price,
  };
}

async function getCreatorBalance() {
  try {
    const creatorWallet = process.env.CREATOR_WALLET;
    if (!creatorWallet) return 0;
    const conn = getConnection();
    const pubkey = new PublicKey(creatorWallet);
    const balance = await conn.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (err) {
    console.error('[Solana] getCreatorBalance error:', err.message);
    return 0;
  }
}

async function sendSOL(toAddress, amountSOL) {
  const privateKeyStr = process.env.CREATOR_PRIVATE_KEY;
  if (!privateKeyStr) throw new Error('CREATOR_PRIVATE_KEY not set');
  const conn = getConnection();
  const privateKeyBytes = bs58.decode(privateKeyStr);
  const keypair = Keypair.fromSecretKey(privateKeyBytes);
  const toPubkey = new PublicKey(toAddress);
  const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);
  const transaction = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: keypair.publicKey, toPubkey, lamports })
  );
  const sig = await conn.sendTransaction(transaction, [keypair]);
  await conn.confirmTransaction(sig, 'confirmed');
  return sig;
}

module.exports = { getTokenBalance, getTokenPrice, checkHolding, getCreatorBalance, sendSOL };
