/**
 * @file Defines the hydrater settings.
 */

// nodeEnv can either be "development" or "production"
var nodeEnv = process.env.nodeEnv || "development";
var defaultPort = 8000;

// Number of pdf instance to run simultaneously per cluster
var defaultConcurrency = 1;

if(nodeEnv === "production") {
  defaultPort = 80;
}

// The quality (in DPI) of images
var defaultQuality = 144;

// Exports configuration
module.exports = {
  env: nodeEnv,
  port: process.env.PORT || defaultPort,
  quality: process.env.QUALITY || defaultQuality,

  concurrency: process.env.PDF_CONCURRENCY || defaultConcurrency,
  redisUrl: process.env.REDIS_URL,
  appName: process.env.APP_NAME || "pdf-hydrater",

  opbeat: {
    organizationId: process.env.OPBEAT_ORGANIZATION_ID,
    appId: process.env.OPBEAT_APP_ID,
    secretToken: process.env.OPBEAT_SECRET_TOKEN
  }
};
