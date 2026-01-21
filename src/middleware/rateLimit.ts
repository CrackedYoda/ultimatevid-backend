import { Request,Response, NextFunction } from "express";
import {getRedis} from "../lib/redis";

const WINDOW = 60; // time window in seconds
const MAX_REQUESTS = 5; // max requests per window

export const rateLimit =   async (req: Request, res: Response, next: NextFunction) => { 
const redis = await getRedis();

const ip = req.ip;
const key = `rate-limit:${ip}`;

const current = await redis.incr(key);

if (current === 1) {
    await redis.expire(key, WINDOW);
}


if (current > MAX_REQUESTS) {
    return res.status(429).json({
        message: "Too many requests, try again later."
    });
}

next();
}