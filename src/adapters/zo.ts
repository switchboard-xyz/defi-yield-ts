import {Connection, PublicKey, Transaction} from "@solana/web3.js";
import {Provider, utils} from "@project-serum/anchor";
import {Cluster, createProgram, State} from "@zero_one/client";
import {AssetRate, ProtocolRates} from "src/types";

export async function fetch(url: string): Promise<ProtocolRates> {
  const options = Provider.defaultOptions();
  const connection = new Connection(url, options);
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

  const rates: AssetRate[] = Object.values(state.assets).map(a => {
    return {
      asset: a.symbol,
      mint: new PublicKey(a.mint),
      deposit: a.supplyApy,
      borrow: a.borrowsApy
    } as AssetRate
  })

  return {
    protocol: "01",
    rates
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
