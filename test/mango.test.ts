import assert from 'assert';
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Mango', () => {

  it('Fetch Mango Rates.', async () => {
    const rateObserver = new RateObserver();
    const url = "https://solana-api.projectserum.com/";
    const protocolRates: ProtocolRates = await rateObserver.fetch('mango', url);
    assert(protocolRates.protocol === 'mango');
    assert(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
