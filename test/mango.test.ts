import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Mango', () => {

  it('Fetch Mango Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('mango');
    assert.isTrue(protocolRates.protocol === 'mango');
    assert.isTrue(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert.isTrue(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
