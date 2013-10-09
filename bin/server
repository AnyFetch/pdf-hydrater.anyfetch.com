#!/bin/env node
// # bin/server
// Launch a node app

// Load configuration
var config = require("../config/configuration.js");
var server = require('../app.js');

// Start the server
var spawner = require('sspawn')(server, {port: config.port, workers: config.workers});
spawner.start();
