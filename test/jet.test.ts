import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Jet', () => {

  it('Fetch Jet Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('jet');
    assert.isTrue(protocolRates.protocol === 'jet');
    assert.isTrue(protocolRates.rates.length > 0);
  });

});
