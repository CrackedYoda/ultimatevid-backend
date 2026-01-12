# Ultimate Video Downloader - Backend

A comprehensive TypeScript backend for downloading videos from multiple platforms including YouTube, Instagram, Facebook, TikTok, and Twitter/X using `yt-dlp`.

## Features

- ✅ **Multi-Platform Support**: YouTube, Instagram, Facebook, TikTok, Twitter/X
- ✅ **Progress Tracking**: Real-time download progress with percentage and size metrics
- ✅ **Quality Selection**: Download videos in different quality options (YouTube)
- ✅ **Audio-Only**: Extract audio from videos (YouTube)
- ✅ **Metadata Extraction**: Get video information without downloading
- ✅ **Error Handling**: Comprehensive error handling and validation
- ✅ **File Size Limits**: Configurable maximum file size checking
- ✅ **Type Safe**: Full TypeScript support with proper typing
- ✅ **Well Tested**: Comprehensive Jest test suite with unit and integration tests

## Installation

### Prerequisites

- Node.js 16+ (or 18+ recommended)
- Python 3.8+ (for yt-dlp)
- yt-dlp installed globally or locally

### Install yt-dlp

```bash
# Using pip (recommended)
pip install yt-dlp

# Or using chocolatey (Windows)
choco install yt-dlp

# Or using homebrew (macOS)
brew install yt-dlp
```

### Install Dependencies

```bash
npm install

# For development/testing
npm install --save-dev jest ts-jest @types/jest
```

## Project Structure

```
ultimatevid-backend/
├── services/
│   ├── ytProcess.ts          # YouTube downloader (ytdl-core)
│   └── fb_instaProcess.ts    # Multi-platform downloader (yt-dlp)
├── tests/
│   ├── setup.ts              # Jest setup and configuration
│   ├── downloader.test.ts    # Unit tests for all platforms
│   ├── ytProcess.test.ts     # Unit tests for YouTube service
│   └── integration.test.ts   # Integration tests across platforms
├── jest.config.js            # Jest configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Usage

### Basic Download

```typescript
import { downloadVideo, isValidUrl } from './services/fb_instaProcess';

// Download from any supported platform
const filePath = await downloadVideo({
  url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
  outputPath: './downloads',
  onProgress: (progress) => {
    console.log(`Downloading: ${progress.percent}%`);
  },
});

console.log(`Downloaded to: ${filePath}`);
```

### Platform-Specific Downloads

```typescript
import {
  downloadYouTube,
  downloadInstagram,
  downloadFacebook,
  downloadTikTok,
  downloadTwitter,
} from './services/fb_instaProcess';

// YouTube
await downloadYouTube({
  url: 'https://youtube.com/watch?v=123abc',
  outputPath: './downloads',
});

// Instagram
await downloadInstagram({
  url: 'https://instagram.com/p/ABC123def/',
  outputPath: './downloads',
});

// TikTok
await downloadTikTok({
  url: 'https://tiktok.com/@username/video/123',
  outputPath: './downloads',
});
```

### YouTube-Specific Features

```typescript
import { YTHandler } from './services/ytProcess';

const handler = new YTHandler();

// Download with specific quality
await handler.downloadWithQuality('https://youtube.com/watch?v=123', '720p', {
  outputPath: './downloads',
});

// Download audio only
await handler.downloadAudioOnly({
  url: 'https://youtube.com/watch?v=123',
  outputPath: './downloads',
});

// Get available qualities
const qualities = await handler.getAvailableQualities('https://youtube.com/watch?v=123');
console.log('Available qualities:', qualities);

// Get video metadata
const info = await handler.getVideoInfo('https://youtube.com/watch?v=123');
console.log('Video info:', info);
```

### Progress Tracking

```typescript
import { downloadVideo } from './services/fb_instaProcess';

await downloadVideo({
  url: 'https://youtube.com/watch?v=123',
  outputPath: './downloads',
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percent}%`);
    console.log(`Downloaded: ${progress.downloaded} bytes`);
    console.log(`Total: ${progress.total} bytes`);
  },
});
```

### Metadata Extraction

```typescript
import { getVideoMetadata, getPlatform, isValidUrl } from './services/fb_instaProcess';

const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';

// Validate URL
if (!isValidUrl(url)) {
  console.log('Invalid URL');
}

// Get platform
const platform = getPlatform(url);
console.log(`Platform: ${platform}`);

// Get metadata
const metadata = await getVideoMetadata(url);
console.log('Metadata:', metadata);
```

## Configuration

### Download Options

```typescript
interface DownloadWithProgressOptions {
  url: string;                          // Video URL
  outputPath?: string;                  // Output directory (default: './downloads')
  onProgress?: (progress: DownloadProgress) => void;  // Progress callback
  abortSignal?: AbortSignal;           // For cancellation
  maxFileSize?: number;                 // Max file size in bytes (default: 500MB)
}

interface DownloadProgress {
  percent: number;                      // Progress percentage (0-100)
  downloaded: number;                   // Bytes downloaded
  total: number;                        // Total bytes
}
```

### Supported Platforms

| Platform | URL Pattern | Status |
|----------|-------------|--------|
| YouTube | youtube.com, youtu.be | ✅ Full Support |
| Instagram | instagram.com | ✅ Full Support |
| Facebook | facebook.com | ✅ Full Support |
| TikTok | tiktok.com, vm.tiktok.com | ✅ Full Support |
| Twitter/X | twitter.com, x.com | ✅ Full Support |

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and classes
  - `downloader.test.ts`: Tests for all platforms
  - `ytProcess.test.ts`: Tests for YouTube handler

- **Integration Tests**: Test cross-platform functionality
  - `integration.test.ts`: Full integration tests across all platforms

## Test Coverage

The test suite includes:

- ✅ URL validation for all platforms
- ✅ Platform detection
- ✅ Download flow simulation
- ✅ Error handling
- ✅ Progress tracking
- ✅ Output directory management
- ✅ File size validation
- ✅ Metadata operations
- ✅ Cross-platform consistency
- ✅ Type safety checks

## Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build           # Build TypeScript to JavaScript

# Running
npm start               # Start the application

# Testing
npm test               # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Error Handling

The services provide meaningful error messages:

```typescript
try {
  await downloadVideo({ url: 'invalid-url', outputPath: './downloads' });
} catch (error) {
  console.error(error.message);
  // 'Unsupported URL. Supported platforms: YouTube, Instagram, Facebook, TikTok, Twitter'
}
```

## Limitations

- **yt-dlp Required**: Must have yt-dlp installed for multi-platform downloads
- **File Size**: Default 500MB limit (configurable)
- **Network**: Downloads depend on network speed and platform API availability
- **Rate Limiting**: Some platforms may rate limit downloads

## Dependencies

### Production
- `ytdl-core`: YouTube video downloader
- `cors`: CORS middleware
- `express`: Web framework
- `helmet`: Security headers

### Development
- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `@types/jest`: TypeScript definitions for Jest
- `typescript`: TypeScript compiler
- `ts-node-dev`: Development server

## Performance

- **Memory Efficient**: Uses streams for large files
- **Progress Tracking**: Real-time progress updates
- **Concurrent Downloads**: Supports multiple simultaneous downloads
- **Error Recovery**: Automatic retry logic with exponential backoff (when configured)

## Security

- URL validation for all input
- File size limits to prevent disk space issues
- Timeout handling for network requests
- Safe file path handling

## Troubleshooting

### yt-dlp Not Found

```
Error: yt-dlp is not installed. Install it with: pip install yt-dlp
```

**Solution**: Install yt-dlp using pip or your package manager.

### Download Timeout

```
Error: Download timeout
```

**Solution**: Check your internet connection or try a different video.

### File Size Exceeds Limit

```
Error: File size (150.0MB) exceeds limit (100.0MB)
```

**Solution**: Increase `maxFileSize` option in download configuration.

### Invalid Platform URL

```
Error: Unsupported URL. Supported platforms: ...
```

**Solution**: Use valid URLs from supported platforms.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request

## License

ISC

## Author

Your Name

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the test files for usage examples
3. Check yt-dlp documentation for platform-specific issues

## Future Enhancements

- [ ] Database integration for download history
- [ ] Queue management for bulk downloads
- [ ] Format conversion (MP3, MP4, WebM)
- [ ] Playlist download support
- [ ] Subtitle extraction
- [ ] Cloud storage integration
- [ ] API rate limiting
- [ ] Webhook notifications
