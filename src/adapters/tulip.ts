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
  const rates: AssetRate[] = $(".lend-table__row-item").map((i, el) => {
    return {
      // @ts-ignore
      asset: $(el).find(".lend-table__row-item__asset__text-name").contents()[0].data,
      deposit: toRate($(el).find(".lend-table__row-item__cell span span").first().text() + "%"),
    };
  }).toArray().filter((assetRate) => { return isSupportedAsset(assetRate.asset); });

  return {
    protocol: 'tulip',
    rates,
  };
}

function isSupportedAsset(asset: string): boolean {
  switch (asset) {
    case 'BTC': return true;
    case 'ETH': return true;
    case 'SOL': return true;
    case 'USDC': return true;
    default: return false;
  }
}
