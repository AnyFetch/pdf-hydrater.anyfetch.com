'use strict';

// Load configuration and initialize server
var anyfetchHydrater = require('anyfetch-hydrater');

var config = require('./config/configuration.js');
var pdfhtml = require('./lib/');

var serverConfig = {
  concurrency: config.concurrency,
  hydrater_function: pdfhtml
};

var server = anyfetchHydrater.createServer(serverConfig);

// Expose the server
module.exports = server;
