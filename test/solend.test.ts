import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('Solend', () => {

  it('Fetch Solend Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates = await rateObserver.fetch('solend');
    assert.isTrue(protocolRates.protocol === 'solend');
    assert.isTrue(protocolRates.rates.length > 0);
  });

});
