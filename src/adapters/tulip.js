const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const userAgent = require("user-agents");

export async function fetch() {
  const url = "https://tulip.garden/lend";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);
  const rates = $(".lend-table__row-item").map((i, el) => {
    return {
      // @ts-ignore
      name: $(el).find(".lend-table__row-item__asset__text-name").contents()[0].data,
      apy: $(el).find(".lend-table__row-item__cell span span").first().text() + "%",
    };
  }).toArray();

  return {
    name: "Tulip",
    rates,
  };
}
