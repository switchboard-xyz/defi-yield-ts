const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const userAgent = require("user-agents");

export async function fetch() {
  const url = "https://mainnet.port.finance/#/supply";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);
  const rates = $("tbody")
    .children()
    .map(function (i, el) {
      return {
        name: $(el).find("td:first-child span").text().trim(),
        deposit: $(el).find("td:last-child em").text().trim().replace(/\+$/, ''),
      };
    })
    .toArray();

  return {
    name: "Port Finance",
    rates,
  };
}
