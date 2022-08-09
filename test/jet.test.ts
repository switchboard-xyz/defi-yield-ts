import { Connection } from "@solana/web3.js";
import assert from "assert";
import { RateObserver } from "../src/rateObserver";
import { ProtocolRates } from "../src/types";

describe("Jet", () => {
  it("Fetch Jet Rates.", async () => {
    const rateObserver = new RateObserver();
    const connection = new Connection("https://ssc-dao.genesysgo.net/");
    const protocolRates: ProtocolRates = await rateObserver.fetch(
      "jet",
      connection
    );
    assert(protocolRates.protocol === "jet");
    assert(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => {
      assert(rateObserver.isSupportedToken(rate.asset, rate.mint));
    });
  });
});
