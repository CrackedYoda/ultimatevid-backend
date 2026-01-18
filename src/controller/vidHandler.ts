import e, { Request, Response } from "express";
import fetch from "node-fetch";
import { pipeline } from "stream/promises";
import { extractYtDlp } from "../services/vidProcessor";
import getVideoUrl from "../services/puppeteer";
import { detectPlatform } from "../helper/checkVid";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { isM3U8 } from "../helper/detectFormat";
import {
  getVideoInfo,
  downloadYoutubeVideo,
  getAvailableQualities,
} from "../services/ytProcess";


const socials = ["facebook", "reddit", "twitter", "tiktok","youtube"];

export const vidHandler = async (req: Request, res: Response) => {
  // Handle file upload logic here

  if (!req.body || !req.body.url) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (typeof req.body.url !== "string") {
    return res.status(400).json({ error: "URL must be a string" });
  }

  const { url } = req.body;
  console.log("Fetching YouTube video info for URL:", url);

  // try {
  // extractYtDlp(url).then(info => {
  //   res.json({ info });
  // }).catch(err => {
  //   res.status(500).json({ error: 'Failed to fetch video info', details: err.message });
  // });
  if (socials.includes(detectPlatform(url))) {
    console.log(
      "Detected social media platform, using puppeteer to extract video URL.",
    );
    try {
      const videoUrl = await getVideoUrl(url);
      if (videoUrl) {
        console.log("Video URL:", videoUrl);
        res.json({ videoUrl });
      } else {
        res.status(404).json({ error: "Video URL not found on the page" });
      }
    } catch (error) {
      console.error("Error fetching YouTube video info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // else if (detectPlatform(url) === 'youtube'){
  //   try {
  //     const info = await getAvailableQualities(url);
  //     console.log('Downloaded YouTube video info:', info);
  //     res.json({ info });
  //   } catch (error) {
  //     console.error('Error downloading YouTube video:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }

  // }
  else {
    try {
      const info = await extractYtDlp(url);
      console.log("Extracted video info:", info);
      const videoUrl = info.formats[0]?.url 
      console.log("Video URL:", videoUrl);
      res.json({ videoUrl });
    } catch (error) {
      console.error("Error fetching YouTube video info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const downloadVid = async (req: Request, res: Response) => {
  const mediaUrl = req.query.url as string;

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
        "-loglevel", "error",
  "-y",
  "-i", mediaUrl,

  // map streams safely
  "-map", "0:v:0",
  "-map", "0:a?",

  // copy video if possible
  "-c:v", "copy",

  // ALWAYS re-encode audio to AAC for MP4
  "-c:a", "aac",
  "-b:a", "128k",

  "-movflags", "frag_keyframe+empty_moov",
  "-f", "mp4",
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
          new Error(`Failed to fetch media. Status: ${response.status}`),
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
};

// export const downloadYtVid = async (req: Request, res: Response) => {
//  const url: any = req.query.url;
//   const quality = req.query.quality || "1080";

//   if (!url) {
//     return res.status(400).end();
//   }

//   res.setHeader("Content-Type", "video/mp4");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename="video-${quality}p.mp4"`
//   );

//   const ytdlp: ChildProcessWithoutNullStreams = spawn("yt-dlp", [
//     "-f",
//     `bv*[height<=${quality}]+ba/b`,
//     "--merge-output-format",
//     "mp4",
//     "-o",
//     "-",
//     url,
//   ]);

//   ytdlp.stdout.pipe(res);

//   ytdlp.stderr.on("data", d => {
//     console.log(d.toString());
//   });
// };
