import assert from 'assert';
import { RateObserver } from '../src'
import { ProtocolRates } from '../src'

describe('01', () => {

  it('Fetch 01 Rates.', async () => {
    const rateObserver = new RateObserver();
    const url = "https://solana-api.projectserum.com/";
    const protocolRates: ProtocolRates = await rateObserver.fetch('01', url);
    assert(protocolRates.protocol === '01');
    assert(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
