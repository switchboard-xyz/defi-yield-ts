import assert from 'assert';
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Solend', () => {

  it('Fetch Solend Rates.', async () => {
    const rateObserver = new RateObserver();
    const url = "https://jetprot-main-0d7b.mainnet.rpcpool.com/";
    const protocolRates: ProtocolRates = await rateObserver.fetch('solend', url);
    assert(protocolRates.protocol === 'solend');
    assert(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
