import { spawn } from "child_process";

const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

export function spawnYtdlp2(pageUrl: string, useCookies: boolean = false) {
  const args = [
    "--no-playlist",

    "-S",
    "vcodec:h264,res,acodec:aac",

    "--merge-output-format",
    "mp4",

    "--remux-video",
    "mp4",

    "--downloader",
    "ffmpeg",

    "--downloader-args",
    "ffmpeg:-movflags frag_keyframe+empty_moov",
    "--js-runtimes",
    "node",
    "--remote-components",
    "ejs:github",
  ];

  if (useCookies) {
    args.push("--cookies", "/app/cookies/cookies.txt");
  }

  args.push("-o", "-", pageUrl);

  return spawn(YTDLP_PATH, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
}
