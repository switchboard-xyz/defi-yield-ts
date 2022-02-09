import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const url = "https://projectlarix.com/";

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const cheerio = require("cheerio");
  const $ = cheerio.load(content);
  const rates: AssetRate[] = [];

  return {
    protocol: 'larix',
    rates,
  };
}
