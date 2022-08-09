import { Connection, PublicKey } from "@solana/web3.js";
import * as apricot from "./adapters/apricot.js";
import * as jet from "./adapters/jet.js";
import * as mango from "./adapters/mango.js";
import * as port from "./adapters/port.js";
import * as solend from "./adapters/solend.js";
import * as zo from "./adapters/zo.js";
import TOKENS from "./tokens.json";
import { Protocol, ProtocolRates } from "./types.js";

export class RateObserver {
  async fetch(
    protocol: Protocol,
    connection: Connection
  ): Promise<ProtocolRates> {
    switch (protocol) {
      case "apricot":
        return apricot.fetch(connection);
      //case 'francium': return francium.fetch(url);
      case "jet":
        return jet.fetch(connection);
      //case 'larix': return larix.fetch(url);
      case "mango":
        return mango.fetch(connection);
      case "port":
        return port.fetch(connection);
      case "solend":
        return solend.fetch(connection);
      //case 'tulip': return tulip.fetch(url);
      case "01":
        return zo.fetch(connection);
      default:
        throw new Error(`Invalid protocol: ${protocol}`);
    }
  }

  async fetchAll(connection: Connection): Promise<ProtocolRates[]> {
    return Promise.all([
      this.fetch("apricot", connection),
      //this.fetch('francium', url),
      this.fetch("jet", connection),
      //this.fetch('larix', url),
      this.fetch("mango", connection),
      this.fetch("port", connection),
      this.fetch("solend", connection),
      //this.fetch('tulip', url),
    ]);
  }

  isSupportedToken(symbol: string, mint: PublicKey): boolean {
    return (
      TOKENS.find((token) => {
        return token.symbol === symbol && token.mint === mint.toBase58();
      }) != undefined
    );
  }
}
