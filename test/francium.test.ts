import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Francium', () => {

  it('Fetch Francium Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('francium');
    assert.isTrue(protocolRates.protocol === 'francium');
    assert.isTrue(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert.isTrue(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
