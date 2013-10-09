/**
 * @file Defines the hydrater settings.
 */

// node_env can either be "development" or "production"
var node_env = process.env.NODE_ENV || "development";
var default_port = 8000;

var default_pdf_version = "1.4";
var default_pdf_path = "/etc/pdf-" + default_pdf_version + "/pdf-app-" + default_pdf_version + ".jar";

// Number of pdf instance to run simultaneously per cluster
var default_concurrency = 1;

if(node_env === "production") {
  default_port = 80;
}

// Exports configuration
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,
  workers: process.env.WORKERS || 2,

  pdf_version: process.env.pdf_VERSION || default_pdf_version,
  pdf_path: process.env.pdf_PATH || default_pdf_path,
  concurrency: process.env.pdf_CONCURRENCY || default_concurrency
};
