'use strict';

// Load configuration and initialize server
var anyfetchHydrater = require('anyfetch-hydrater');

var config = require('./config/configuration.js');

config.hydrater_function = __dirname + '/lib/index.js';

var server = anyfetchHydrater.createServer(config);

// Expose the server
module.exports = server;
