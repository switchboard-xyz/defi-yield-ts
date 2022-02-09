const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

export async function fetch() {
  const url = "https://trade.mango.markets/borrow";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);
  const rates = $(".min-w-full tbody tr").map((i, el) => {
    return {
      asset: $(el).find("td div div").text(),
      deposit: $(el).find(".text-th-green").first().text(),
      borrow: $(el).find(".text-th-red").first().text(),
    };
  }).toArray();

  return {
    name: "Mango",
    rates,
  };
}
