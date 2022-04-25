import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('All', () => {

  it('Fetch All Rates.', async () => {
    const rateObserver = new RateObserver();
    const url = "https://jetprot-main-0d7b.mainnet.rpcpool.com/";
    const protocolRates: ProtocolRates[] = await rateObserver.fetchAll(url);
  });

});
