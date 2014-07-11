'use strict';

require('should');
var anyfetchHydrater = require('anyfetch-hydrater');

var pdf = require('../lib/');

var hydrationError = anyfetchHydrater.hydrationError;

describe('Test pdf results', function() {
  it('returns the correct informations', function(done) {
    var document = {
      data: {}
    };

    var changes = anyfetchHydrater.defaultChanges();

    pdf(__dirname + "/samples/cv.pdf", document, changes, function(err, changes) {
      if(err) {
        throw err;
      }
      changes.should.have.property('data');
      changes.data.should.have.property('html');

      changes.data.html
        .should.include('Matt<span class="_ _0"></span>h<span class="_ _1"></span>i<span class="_ _0"></span>e<span class="_ _2"></span>u');
      done();
    });
  });

  it('should return an errored document', function(done) {
    var document = {
      data: {}
    };

    var changes = anyfetchHydrater.defaultChanges();

    pdf(__dirname + "/samples/errored.pdf", document, changes, function(err) {
      if(err instanceof hydrationError) {
        done();
      }
      else {
        done(new Error("invalid error"));
      }
    });
  });

});
