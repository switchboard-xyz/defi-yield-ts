import { assert } from "chai";
import { RateObserver } from '../src'
import { ProtocolRates } from '../src'

describe('01', () => {

  it('Fetch 01 Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('01');
    assert.isTrue(protocolRates.protocol === '01');
    assert.isTrue(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert.isTrue(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
