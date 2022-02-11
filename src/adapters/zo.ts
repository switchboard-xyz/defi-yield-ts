import {AssetRate, ProtocolRates } from "src/types";
import {Cluster, createProgram, State} from "@zero_one/client";
import {Connection, PublicKey, Transaction} from "@solana/web3.js";
import {Provider, utils} from "@project-serum/anchor";

export async function fetch(): Promise<ProtocolRates> {
  const options = Provider.defaultOptions();
  const connection = new Connection("https://api.mainnet-beta.solana.com", options);
  const wallet = new Wallet();
  const provider = new Provider(connection, wallet, options);
  const program = createProgram(provider, Cluster.Mainnet);

  const [globalStateKey, _globalStateNonce] =
    await PublicKey.findProgramAddress(
      [utils.bytes.utf8.encode("statev1")],
      program.programId,
    );
  const globalState = await program.account.globalState!.fetch(
    globalStateKey,
  );
  const state: State = await State.load(program, globalState.state);

  const rates: AssetRate[] = Object.values(state.assets).filter(a => {return isSupportedAsset(a.symbol)}).map(a => {
    return {
      asset: a.symbol,
      deposit: a.supplyApy,
      borrow: a.borrowsApy
    } as AssetRate
  })

  return {
    protocol: "01",
    rates
  }
}

function isSupportedAsset(asset: string): boolean {
  switch (asset) {
    case 'BTC': return true;
    case 'ETH': return true;
    case 'SOL': return true;
    case 'USDC': return true;
    default: return false;
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
