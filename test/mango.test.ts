import { Connection } from "@solana/web3.js";
import assert from "assert";
import { RateObserver } from "../src/rateObserver";
import { ProtocolRates } from "../src/types";

describe("Mango", () => {
  it("Fetch Mango Rates.", async () => {
    const rateObserver = new RateObserver();
    const connection = new Connection("https://ssc-dao.genesysgo.net/");
    const protocolRates: ProtocolRates = await rateObserver.fetch(
      "mango",
      connection
    );
    assert(protocolRates.protocol === "mango");
    assert(protocolRates.rates.length > 0);
    // console.log(JSON.stringify(protocolRates.rates, undefined, 2));
    // protocolRates.rates.forEach((rate) => {
    //   assert(rateObserver.isSupportedToken(rate.asset, rate.mint));
    // });
  });
});
