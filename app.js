'use strict';

// Load configuration and initialize server
var cluestrFileHydrater = require('cluestr-file-hydrater');

var config = require('./config/configuration.js');
var pdfhtml = require('./lib/hydrater-pdf');

var serverConfig = {
  concurrency: config.concurrency,
  hydrater_function: pdfhtml
};

var server = cluestrFileHydrater.createServer(serverConfig);

// Expose the server
module.exports = server;
