import { RateObserver } from '../src/rateObserver'
import { ProtocolRates } from '../src/types'

describe('All', () => {

  it('Fetch All Rates.', async () => {
    const rateObserver = new RateObserver();
    const url = "https://solana-api.projectserum.com/";
    const protocolRates: ProtocolRates[] = await rateObserver.fetchAll(url);
  });

});
