import { spawn } from "child_process";


const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

export function spawnYtdlp2(pageUrl: string) {

  return spawn(
    YTDLP_PATH,
    [
      "--no-playlist",

      "-f",
      "bv*[vcodec^=avc1]+ba[acodec^=mp4a]/b[ext=mp4]/b",

      "--merge-output-format",
      "mp4",

      "--remux-video",
      "mp4",

      "--downloader",
      "ffmpeg",

      "--downloader-args",
      "ffmpeg:-movflags frag_keyframe+empty_moov",

      "-o",
      "-", // 👈 WRITE TO STDOUT (NO FILE PATH)
      pageUrl,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

}
