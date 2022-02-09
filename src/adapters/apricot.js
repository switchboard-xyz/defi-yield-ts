const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

export async function fetch() {
  const url = "https://app.apricot.one/";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const rates = [];

  return {
    name: "Apricot",
    rates,
  };
}
