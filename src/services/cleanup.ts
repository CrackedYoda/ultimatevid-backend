import fs from 'fs';
import path from 'path';

const VIDEOS_DIR = path.join(process.cwd(), 'videos');
const DELETE_AGE_MS = 7 * 60 * 1000; // 7 minutes
const INTERVAL_MS = 7 * 60 * 1000; // Run every 7 minutes

export function startCleanupTask() {
    console.log('[Cleanup] Starting video cleanup task...');

    // Ensure directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
        console.warn(`[Cleanup] Directory not found: ${VIDEOS_DIR}`);
        return;
    }

    // Initial run
    runCleanup();

    // Scheduled run
    setInterval(runCleanup, INTERVAL_MS);
}

function runCleanup() {
    console.log('[Cleanup] Running cleanup scan...');

    fs.readdir(VIDEOS_DIR, (err, files) => {
        if (err) {
            console.error('[Cleanup] Error reading directory:', err);
            return;
        }

        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(VIDEOS_DIR, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`[Cleanup] Error checking stats for ${file}:`, err);
                    return;
                }

                if (now - stats.mtimeMs > DELETE_AGE_MS) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`[Cleanup] Error deleting ${file}:`, err);
                        } else {
                            console.log(`[Cleanup] Deleted old file: ${file}`);
                        }
                    });
                }
            });
        });
    });
}
