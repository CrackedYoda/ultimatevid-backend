
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { isM3U8 } from "../helper/detectFormat";
import { Response } from "express";
import fetch from "node-fetch";
import { pipeline } from "stream/promises";
import { spawn } from "child_process";
import { detectPlatform } from "../helper/checkVid";


puppeteer.use(StealthPlugin());




class videoDownloader {

async  getVideoUrl(pageUrl: string): Promise<string | null> {
  const browser = await puppeteer.launch({
    headless: false, // keep false for reliability
    args: [
      "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync"

    ],
  });
  
  const urlType = detectPlatform(pageUrl);
  try {
  const page = await browser.newPage();
  if (urlType == "facebook") {
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
  await new Promise((resolve) => setTimeout(resolve, 7000));

  if (!videoUrl) {
    throw new Error("No video URL found");
  }

  return videoUrl;
  }catch (error) {
    console.error("Error detecting platform:", error);
  }
  finally {
    await browser.close();
  }
  return null;
}

async downloadVideoUrl(pageUrl: string, res: Response) {
    const mediaUrl = pageUrl;

    if (!mediaUrl || typeof mediaUrl !== "string") {
      return res
        .status(400)
        .json({ field: "url", message: "A valid URL is required" });
    }

    res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
    res.setHeader("Content-Type", "video/mp4");

    try {
      if (isM3U8(mediaUrl)) {
        const ffmpeg = spawn("ffmpeg", [
          "-loglevel",
          "error",
          "-y",
          "-i",
          mediaUrl,

          // map streams safely
          "-map",
          "0:v:0",
          "-map",
          "0:a?",

          // copy video if possible
          "-c:v",
          "copy",

          // ALWAYS re-encode audio to AAC for MP4
          "-c:a",
          "aac",
          "-b:a",
          "128k",

          "-movflags",
          "frag_keyframe+empty_moov",
          "-f",
          "mp4",
          "pipe:1",
        ]);

        ffmpeg.stderr.on("data", (d) => {
          console.log(d.toString());
        });

        await pipeline(ffmpeg.stdout, res);
      } else {
        console.log("Fetching media from URL:", mediaUrl);
        const response: any = await fetch(mediaUrl);
        console.log("Response status:", response);
        if (!response.ok) {
          res.destroy(
            new Error(`Failed to fetch media. Status: ${response.status}`)
          );
          return;
        }
        await pipeline(response.body, res);
      }
    } catch (err) {
      console.error("Streaming error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Streaming failed" });
      }
    }
  }

}

export default new videoDownloader;