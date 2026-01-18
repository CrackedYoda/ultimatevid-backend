export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'reddit' | 'other';

export const detectPlatform = (url: string): Platform => {
    const patterns = {
        facebook: /(?:facebook\.com|fb\.watch|fb\.com)/i,
        instagram: /(?:instagram\.com)/i,
        tiktok: /(?:tiktok\.com|vm\.tiktok\.com)/i,
        youtube: /(?:youtube\.com|youtu\.be)/i,
        twitter: /(?:twitter\.com|x\.com)/i,
        reddit: /(?:reddit\.com)/i,
    };

    for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) {
            return platform as Platform;
        }
    }

    return 'other';
};
