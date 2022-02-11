import { token } from "@project-serum/anchor/dist/cjs/utils";
import { PublicKey } from "@solana/web3.js"
import * as apricot from './adapters/apricot';
import * as francium from './adapters/francium';
import * as jet from './adapters/jet';
import * as larix from './adapters/larix';
import * as mango from './adapters/mango';
import * as port from './adapters/port';
import * as solend from './adapters/solend';
import * as tulip from './adapters/tulip';
import * as zo from './adapters/zo';
import TOKENS from './tokens.json';
import { Protocol, ProtocolRates } from './types';

export class RateObserver {

  async fetch(protocol: Protocol): Promise<ProtocolRates> {
    switch (protocol) {
      case 'apricot': return apricot.fetch();
      case 'francium': return francium.fetch();
      case 'jet': return jet.fetch();
      case 'larix': return larix.fetch();
      case 'mango': return mango.fetch();
      case 'port': return port.fetch();
      case 'solend': return solend.fetch();
      case 'tulip': return tulip.fetch();
      case '01': return zo.fetch();
      default: throw new Error(`Invalid protocol: ${protocol}`);
    }
  }

  async fetchAll(): Promise<ProtocolRates[]> {
    return Promise.all([
      this.fetch('apricot'),
      this.fetch('francium'),
      this.fetch('jet'),
      this.fetch('larix'),
      this.fetch('mango'),
      this.fetch('port'),
      this.fetch('solend'),
      this.fetch('tulip'),
    ]);
  }

  isSupportedToken(symbol: string, mint: PublicKey): boolean {
    return TOKENS.find((token) => { return token.symbol === symbol && token.mint === mint.toBase58(); }) != undefined;
  }

}
