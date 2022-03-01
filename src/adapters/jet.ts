import { JetClient, JetMarket, JetReserve, JET_MARKET_ADDRESS } from "@jet-lab/jet-engine"
import { Provider } from "@project-serum/anchor"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const options = Provider.defaultOptions();
  const connection = new Connection("https://jetprotocol.genesysgo.net/", options);
  const wallet = new Wallet();
  const provider = new Provider(connection, wallet, options);
  const client = await JetClient.connect(provider, true);
  const markets = await JetMarket.allMarkets(client);
  const market = await JetMarket.load(client, JET_MARKET_ADDRESS);
  const reserves = await JetReserve.loadMultiple(client, market);

  const rates: AssetRate[] = reserves.filter((reserve) => { return isSupportedAsset(reserve.data.productData.product.symbol); }).map((reserve) => {
    const asset = toAsset(reserve.data.productData.product.symbol);
    reserve.data.depositApy
    return {
      asset,
      mint: reserve.data.tokenMint,
      borrowAmount: reserve.data.state.outstandingDebt.tokens,
      borrowRate: reserve.data.borrowApr,
      depositAmount: reserve.data.marketSize.tokens,
      depositRate: reserve.data.depositApy,
    } as AssetRate;
  });

  return {
    protocol: 'jet',
    rates,
  };
}

function isSupportedAsset(asset: string): boolean {
  switch (asset) {
    case 'Crypto.BTC/USD': return true;
    case 'Crypto.ETH/USD': return true;
    case 'Crypto.SOL/USD': return true;
    case 'Crypto.USDC/USD': return true;
    default: return false;
  }
}

function toAsset(asset: string): string {
  switch (asset) {
    case 'Crypto.BTC/USD': return 'BTC';
    case 'Crypto.ETH/USD': return 'ETH';
    case 'Crypto.SOL/USD': return 'SOL';
    case 'Crypto.USDC/USD': return 'USDC';
    default: throw new Error(`Unsupported asset: ${asset}`);
  }
}

interface AnchorWallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
}

class Wallet implements AnchorWallet {

  constructor() {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    throw new Error('Not implemented.');
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    throw new Error('Not implemented.');
  }

  get publicKey(): PublicKey {
    throw new Error('Not implemented.');
  }
}
