'use strict';

/**
 * @file Hydrate the file from scratch.
 * Download it from Cluestr, save it to local storage, run pdf and returns the result.
 *
 * This helper is used in the server queue.
 */


var async = require('async');
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');

var pdfShell = require('./pdf-shell.js');


/**
 * Take a Cluestr document and returns metadatas
 *
 * @param {Object} task Task object, keys must be file_path (file URL) and callback (URL)
 * @param {Function} cb Callback, first parameter is the error.
 */
module.exports = function(task, done) {
  console.log("Starting task: ", task.file_path);
  var serverUrl = require('../../../app.js').url;

  async.waterfall([
    function(cb) {
      // Download the file from task.file_path, store it in temporary file
      var path = '/tmp/' + crypto.randomBytes(20).toString('hex');

      // Sometimes, request fire "end" and sometimes "finish".
      var hasFinished = false;
      var endFunction = function() {
        if(!hasFinished) {
          cb(null, path);
          hasFinished = true;
        }
      };

      // Download the file
      request(task.file_path)
        .pipe(fs.createWriteStream(path))
        .on('error', function(err) {
          throw err;
        })
        .on('end', endFunction)
        .on('finish', endFunction);
    },
    function(path, cb) {
      // Start a shell with pdf and retrieve results
      pdfShell(path , function(err, metas) {
        cb(err, path, metas);
      });
    },
    function(path, metas, cb) {
      // Remove file from fs
      fs.unlink(path, function(err) {
        cb(err, metas);
      });
    },
    function(metas, cb) {
      // Upload to server

      // Datas to be sent
      var json = {
        hydrater: serverUrl + '/hydrate',
        metadatas: metas,
      };
      if(metas.raw || metas.html) {
        json.binary_document_type = "document";
      }


      var params = {
        url: task.callback,
        json: json
      };
      request.patch(params, cb);
      console.log("Patching document onto Cluestr.");
    }
  ], done);
};
