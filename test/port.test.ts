import { Connection } from "@solana/web3.js";
import assert from "assert";
import { RateObserver } from "../src/rateObserver";
import { ProtocolRates } from "../src/types";

describe("Port", () => {
  it("Fetch Port Rates.", async () => {
    const rateObserver = new RateObserver();
    const connection = new Connection("https://ssc-dao.genesysgo.net/");
    const protocolRates: ProtocolRates = await rateObserver.fetch(
      "port",
      connection
    );
    assert(protocolRates.protocol === "port");
    assert(protocolRates.rates.length > 0);
    protocolRates.rates.forEach((rate) => {
      assert(rateObserver.isSupportedToken(rate.asset, rate.mint));
    });
  });
});
