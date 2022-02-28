import { PublicKey } from "@solana/web3.js";
import TOKENS from "../tokens.json";
import { AssetRate, ProtocolRates, toRate } from "../types";

export async function fetch(_url: string): Promise<ProtocolRates> {
  const url = "https://francium.io/app/lend";

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const cheerio = require("cheerio");
  const $ = cheerio.load(content);
  let rates: AssetRate[] = [];
  $(".ant-table-row").map((i, el) => {
    const asset: string = toAsset($(el).find("td div").first().text());
    const token = TOKENS.find((token) => {
      return token.symbol === asset;
    });
    if (token) {
      rates.push({
        asset: token.symbol,
        mint: new PublicKey(token.mint),
        deposit: toRate($(el).find("td div p").first().text()),
        borrow: undefined,
      });
    }
  });

  return {
    protocol: "francium",
    rates,
  } as ProtocolRates;
}

function toAsset(asset: string): string {
  switch (asset) {
    case "weWETH (whETH)":
      return "whETH";
    default:
      return asset;
  }
}
