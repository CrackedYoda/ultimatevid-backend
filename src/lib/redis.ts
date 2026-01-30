// src/lib/redis.ts
import { createClient, RedisClientType } from "redis";

let redis: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (redis) return redis;

  redis = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  // IMPORTANT: handle connection errors
  redis.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redis.on("connect", () => {
    console.log("Redis connecting...");
  });

  redis.on("ready", () => {
    console.log("Redis connected and ready");
  });

  // Connect only once
  if (!redis.isOpen) {
    await redis.connect();
  }

  return redis;
}
