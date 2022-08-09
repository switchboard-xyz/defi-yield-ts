import { Connection } from "@solana/web3.js";
import { RateObserver } from "../src/rateObserver";
import { ProtocolRates } from "../src/types";

describe("All", () => {
  it("Fetch All Rates.", async () => {
    const rateObserver = new RateObserver();
    const connection = new Connection("https://ssc-dao.genesysgo.net/");
    const protocolRates: ProtocolRates[] = await rateObserver.fetchAll(
      connection
    );
  });
});
