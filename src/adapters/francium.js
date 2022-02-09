const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

export async function fetch() {
  const url = "https://francium.io/app/lend";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 15000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);
  const rates = $(".ant-table-row").map((i, el) => {
    return {
      // @ts-ignore
      asset: $(el).find("td div").first().text(),
      // @ts-ignore
      deposit: $(el).find("td div p").first().text(),
    };
  }).toArray();

  return {
    name: "Francium",
    rates,
  };
}
