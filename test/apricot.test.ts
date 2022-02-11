import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Apricot', () => {

  it('Fetch Apricot Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('apricot');
    assert.isTrue(protocolRates.protocol === 'apricot');
    assert.isTrue(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert.isTrue(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
