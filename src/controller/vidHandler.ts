import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { pipeline } from 'node:stream';
import { promisify } from 'util';
import { extractYtDlp } from '../services/vidProcessor';




export const vidHandler = async (req: Request, res: Response) => {
  // Handle file upload logic here

  if (!req.body || !req.body.url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (typeof req.body.url !== 'string') {
    return res.status(400).json({ error: 'URL must be a string' });
  }

  if (!req.body.url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
 
  const { url } = req.body;
  
  
    try {
    extractYtDlp(url).then(info => {
      res.json({ info });
    }).catch(err => {
      res.status(500).json({ error: 'Failed to fetch video info', details: err.message });
    });
  
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }



};

const streamPipeline = promisify(pipeline);

export const downloadVid = async (req: Request, res: Response) => { 

   const mediaUrl = req.body.url || req.query.url as string;

  if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
    return res.status(400).json({ field: 'url', message: 'A valid URL is required' });
  }
 const response = await fetch(mediaUrl);

 if (!response.ok || !response.body) {
    return res.status(502).json({ field: 'url', message: 'Failed to fetch media' });
  }
  // Forward content-type and length
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  if (contentType) res.setHeader('Content-Type', contentType);
  if (contentLength) res.setHeader('Content-Length', contentLength);

  // Force download
  res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

  // Stream safely with backpressure handling
  try {
    await streamPipeline(response.body as any, res);
  } catch (err) {
    console.error('Streaming error:', err);
    if (!res.headersSent) {
      res.status(500).json({ field: 'stream', message: 'Streaming failed' });
    }
  }
}