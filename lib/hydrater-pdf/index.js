'use strict';
/**
 * @file Define everything that need to be exported for use with the server.
 *
 * This object contains everything that need to be exported (for test or production purposes) : handlers, models and middleware.
 */

module.exports = {
  handlers: {
    hydrater: require('./handlers/hydrater.js'),
  },
  helpers: {
    pdfShell: require('./helpers/pdf-shell.js'),
    hydrate: require('./helpers/hydrate.js'),
  }
};
