'use strict';

/**
 * @file Helper for pdf2htmlEX file processing
 * For more information about Pdf2htmlex :
 * https://github.com/coolwanglu/pdf2htmlEX.git
 */

var fs = require('fs');
var async = require('async');
var shellExec = require('child_process').exec;
var crypto = require('crypto');
var config = require('../config/configuration.js');


/**
 * Extract the content in html of the specified pdf
 *
 * @param {string} path Path of the specified file
 * @param {string} document to hydrate
 * @param {function} cb Callback, first parameter, is the error if any, then the processed data
 */
module.exports = function(path, document, cb) {
  var finalCb = cb;

  async.waterfall([
    function(cb) {
      var outFile = crypto.randomBytes(20).toString('hex');

      var options = [
        '--printing 0', // Disable printing optimization, only for display
        '--no-drm 1', // Disable DRM copy-byte checking (protected PDF fails elsewise)
        '-l 7', // Generate 7 pages at most
        '--data-dir ' + __dirname + '/../config/pdf2htmlEX',
      ];
      shellExec('pdf2htmlEX ' + options.join(' ') + ' --dest-dir /tmp ' + path + ' ' + outFile + ' --hdpi ' + config.quality + ' --vdpi ' + config.quality, {timeout: 300000}, function(err, stdout, stderr) {
        if(err && err.code !== 139) {
          var erroredDocument = {};
          erroredDocument.id = document.id;
          erroredDocument.identifier = document.identifier;
          erroredDocument.hydrationErrored = true;
          erroredDocument.hydrationError = new Error([err, stderr, stdout]);
          return finalCb(null, erroredDocument);
        }
        cb(null, '/tmp/' + outFile);
      });
    },
    function(outPath, cb) {
      fs.readFile(outPath, function(err, data) {
        cb(err, outPath, data);
      });
    },
    function(outPath, data, cb) {
      document.datas.html = data.toString();
      document.document_type = "document";
      cb(null, outPath);
    },
    function(outPath, cb) {
      fs.unlink(outPath, cb);
    },
  ], function(err) {
    cb(err, document);
  });
};
