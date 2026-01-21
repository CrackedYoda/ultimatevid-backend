import{ Request, Response } from "express";
import { detectPlatform } from "../helper/checkVid";;
import videoService from "../services/vidService";
import videoDownloader from "../services/puppeteer";

 const socials = [ ""]; 
//  will use  ytdlp directly instead of puppeteer for socials, less resource intensive

let url: string;

class videoController {

   // vidCheck function to check video title and validity to prevent our ap crashing
  async vidCheck(req: Request, res: Response) { 

     if (!req.body || !req.body.url) {
    return res.status(400).json({ success: false, field: "url", message: "URL is required" });
  }

  if (typeof req.body.url !== "string") {
    return res.status(400).json({ success: false, field: "url", message: "URL must be a string" });}

     url = req.body.url;

     const title = await videoService.getTitle(url);

     return res.status(200).json({ success: true, title: title || "video", url: url });


     
  }



  async vidHandler(req: Request, res: Response) {
  // Handle file upload logic here

  // post req starts here
 

  if (socials.includes(detectPlatform(url))) {
    console.log("Detected social media platform, using puppeteer to extract video URL.",);
    try {
      const videoUrl = await videoDownloader.getVideoUrl(url);
      if (videoUrl) {
        console.log("Video URL:", videoUrl);
        await videoDownloader.downloadVideoUrl(videoUrl, res);
      } else {
        res.status(404).json({ error: "Video URL not found on the page" });
      }
    } catch (error) {
      console.error("Error fetching video info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  else {
    try {
        await videoService.downloadVideo( url, res);
    } catch (error) {
      console.error("Error fetching YouTube video info:", error);
      res.status(500).json({ success: false, field: "url", message: "Something went wrong, Please try again" });
    }
  }
};
}
export default new videoController();
