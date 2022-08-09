import { Connection } from "@solana/web3.js";
import assert from "assert";
import { RateObserver } from "../src";
import { ProtocolRates } from "../src";

describe("01", () => {
  it("Fetch 01 Rates.", async () => {
    const rateObserver = new RateObserver();
    const connection = new Connection("https://ssc-dao.genesysgo.net/");
    const protocolRates: ProtocolRates = await rateObserver.fetch(
      "01",
      connection
    );
    assert(protocolRates.protocol === "01");
    assert(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => {
      assert(rateObserver.isSupportedToken(rate.asset, rate.mint));
    });
  });
});
