'use strict';

require('should');
var anyfetchFileHydrater = require('anyfetch-file-hydrater');

var pdf = require('../lib/');

var hydrationError = anyfetchFileHydrater.hydrationError;

describe('Test pdf results', function() {
  it('returns the correct informations', function(done) {
    var document = {
      datas: {}
    };

    var changes = anyfetchFileHydrater.defaultChanges();

    pdf(__dirname + "/samples/cv.pdf", document, changes, function(err, changes) {
      if(err) {
        throw err;
      }
      changes.should.have.property('datas');
      changes.should.have.property('document_type', "document");
      changes.datas.should.have.property('html');

      changes.datas.html
        .should.include('Matt<span class="_ _0"></span>h<span class="_ _1"></span>i<span class="_ _0"></span>e<span class="_ _2"></span>u');
      done();
    });
  });

  it('should return an errored document', function(done) {
    var document = {
      datas: {}
    };

    var changes = anyfetchFileHydrater.defaultChanges();

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
