/**
 * @file Defines the hydrater settings.
 */

// node_env can either be "development" or "production"
var node_env = process.env.NODE_ENV || "development";
var default_port = 8000;

// Number of pdf instance to run simultaneously per cluster
var default_concurrency = 1;

if(node_env === "production") {
  default_port = 80;
}

//The quality (in DPI) of images
var default_quality = 110;

// Exports configuration
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,
  quality: process.env.QUALITY || default_quality,

  concurrency: process.env.PDF_CONCURRENCY || default_concurrency
};
