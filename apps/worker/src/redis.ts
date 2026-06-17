import IORedis from "ioredis";
import { config } from "./config";

// BullMQ requires maxRetriesPerRequest = null on the connection.
export const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});
