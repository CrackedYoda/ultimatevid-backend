
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());
const videoUrls = new Set<string>();

async function getVideoUrl(pageUrl: string): Promise<string | null> {
  const browser = await puppeteer.launch({
    headless: false, // keep false for reliability
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      // '--no-first-run',
      // '--no-zygote',
      // '--single-process',
      // '--disable-dev-shm-usage'
    ],
  });

  const page = await browser.newPage();
  if (pageUrl.includes("facebook.com") || pageUrl.includes("youtube.com") || pageUrl.includes("tiktok.com")) {
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 " +
        "Mobile/15E148 Safari/604.1"
    );
  } 
   else { await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/85.0.4183.102 Safari/537.36"
    ); }
  

  await page.setDefaultNavigationTimeout(60_000);

  let videoUrl: string | null = null;

  page.on("response", async (response) => {
    const url = response.url();

    // Ignore blob URLs
    if (url.startsWith("blob:")) return;

    if (url.includes(".m3u8") || url.includes(".mp4")) {
      if (!videoUrl) {
        videoUrl = url;
        console.log("Found video URL:", videoUrl);
      }
    }
  });

  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 0 });

  // await page.evaluate(() => {
  //   // Scroll to the bottom of the page to trigger lazy loading
  //   window.scrollTo(0, document.body.scrollHeight);
  // });

  // Let video load and trigger requests
  await new Promise((resolve) => setTimeout(resolve, 10000));

  await browser.close();

  if (!videoUrl) {
    throw new Error("No video URL found");
  }

  return videoUrl;
}

export default getVideoUrl;
