'use strict';

// Load configuration and initialize server
var restify = require('restify');
var async = require('async');

var configuration = require('./config/configuration.js');
var lib = require('./lib/hydrater-pdf');

var handlers = lib.handlers;
var server = restify.createServer();


// Middleware Goes Here
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.queue = async.queue(lib.helpers.hydrate, configuration.concurrency);

// Load routes
require('./config/routes.js')(server, handlers);

// Expose the server
module.exports = server;
