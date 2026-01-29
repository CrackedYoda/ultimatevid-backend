import {Queue} from "bullmq";
import {bullRedis} from "../lib/bullredis";





export const downloadQueue = new Queue("downloadQueue", {
    connection: bullRedis,
});