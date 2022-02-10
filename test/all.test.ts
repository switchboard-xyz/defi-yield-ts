import { assert } from "chai";
import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('All', () => {

  it('Fetch All Rates.', async () => {
    const rateObserver = new RateObserver();
    const protocolRates: ProtocolRates[] = await rateObserver.fetchAll();
  });

});
