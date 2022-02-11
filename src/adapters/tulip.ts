import { token } from "@project-serum/anchor/dist/cjs/utils";
import { PublicKey } from "@solana/web3.js"
import TOKENS from '../tokens.json';
import { AssetRate, ProtocolRates, toRate } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const url = "https://tulip.garden/lend";

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const userAgent = require("user-agents");
  await page.setUserAgent(userAgent.toString());
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const cheerio = require("cheerio");
  const $ = cheerio.load(content);
  let rates: AssetRate[] = [];
  $(".lend-table__row-item").map((i, el) => {
    const asset: string = $(el).find(".lend-table__row-item__asset__text-name").contents()[0].data;
    const token = TOKENS.find((token) => { return token.symbol === asset; });
    if (token) {
      rates.push({
        asset: token.symbol,
        mint: new PublicKey(token.mint),
        deposit: toRate($(el).find(".lend-table__row-item__cell span span").first().text() + "%"),
        borrow: undefined,
      });
    }
  });

  return {
    protocol: 'tulip',
    rates,
  } as ProtocolRates;
}
