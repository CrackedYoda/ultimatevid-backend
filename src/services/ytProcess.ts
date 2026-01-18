import ytdl from "@distube/ytdl-core";
import fs from 'fs';
import path from 'path';

interface DownloadOptions {
  url: string;
  outputPath?: string;
  quality?: string;
}


export async function downloadYoutubeVideo(
  options: DownloadOptions
): Promise<any> {
  const { url, outputPath = './downloads', quality = 'highest' } = options;

  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title
      .replace(/[^\w\s-]/g, '')
      .slice(0, 50);
    const fileName = `${videoTitle}-${Date.now()}.mp4`;
    const filePath = path.join(outputPath, fileName);

    // Start download
    const stream = ytdl(url, { quality });

    return new Promise((resolve, reject) => {
      stream
        .pipe(fs.createWriteStream(filePath))
        .on('finish', () => {
          console.log(`Download completed: ${filePath}`);
          resolve(filePath);
        })
        .on('error', (error) => {
          console.error('Stream error:', error);
          reject(error);
        });

      stream.on('error', (error) => {
        console.error('Download error:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}



export async function getVideoInfo(url: string) {
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    

    return {
      videoId: details.videoId,
      title: details.title,
      duration: details.lengthSeconds,
      author: details.author.name,
      thumbnailUrl: details.thumbnail?.thumbnails?.[0]?.url,
      isLiveContent: details.isLiveContent,
      formats: info.formats.length,
    };
  } catch (error) {
    console.error('Failed to get video info:', error);
    throw error;
  }
}

// might not use this cause it usually complicates things
export async function getAvailableQualities(url: string) {
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const info = await ytdl.getInfo(url);
    const formats = info.formats;

    const qualities = formats
      .map((format) => ({
        qualityLabel: format.qualityLabel || 'Unknown',
        quality: format.quality as string,
        mimeType: format.mimeType,
        bitrate: format.bitrate,
      }))
      .reduce(
        (unique, format) => {
          if (!unique.find((f) => f.quality === format.quality)) {
            unique.push(format);
          }
          return unique;
        },
        [] as Array<{
          qualityLabel: string;
          quality: string;
          mimeType: string | undefined;
          bitrate: number | undefined;
        }>
      );

    return qualities;
  } catch (error) {
    console.error('Failed to get available qualities:', error);
    throw error;
  }
}
