import { spawn } from "child_process";


const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";





export const getTitle = async (url: string): Promise<string | null> => {
    return new Promise(resolve => {
      const proc = spawn(YTDLP_PATH, [
        "--no-playlist",
        "--print",
        "title",
        url,
      ]);

      let title = "";

      proc.stdout.on("data", d => (title += d.toString()));
      proc.on("close", code =>
        resolve(code === 0 ? title.trim() : null)
      );
      proc.on("error", () => resolve(null));
    });
  }
