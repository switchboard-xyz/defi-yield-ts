import { AssetRate, ProtocolRates, toRate } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const url = "https://mainnet.port.finance/#/supply";

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const cheerio = require("cheerio");
  const $ = cheerio.load(content);
  const rates: AssetRate[] = $("tbody")
    .children()
    .map(function (i, el) {
      return {
        asset: toAsset($(el).find("td:first-child span").text().trim()),
        deposit: toRate($(el).find("td:last-child em").text().trim().replace(/\+$/, '')),
      };
    })
    .toArray().filter((assetRate) => { return isSupportedAsset(assetRate.asset); });

  return {
    protocol: 'port',
    rates,
  };
}

function isSupportedAsset(asset: string): boolean {
  switch (asset) {
    case 'BTC': return true;
    case 'SOL': return true;
    case 'USDC': return true;
    default: return false;
  }
}

function toAsset(asset: string): string {
  switch (asset) {
    case 'Bitcoin': return 'BTC';
    case 'Solana': return 'SOL';
    case 'USD Coin': return 'USDC';
    default: return asset;
  }
}
