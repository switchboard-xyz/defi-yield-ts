import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Tulip', () => {

  it('Fetch Tulip Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('tulip');
    assert.isTrue(protocolRates.protocol === 'tulip');
    assert.isTrue(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => { assert.isTrue(rateObserver.isSupportedToken(rate.asset, rate.mint)); })
  });

});
