'use strict';

require('should');
var fs = require('fs');

var pdf = require('../lib/hydrater-pdf');


describe('Test pdf results', function() {
  it('returns the correct informations', function(done) {
    var document = {
      metadatas: {}
    };

    pdf("/vagrant/test/samples/cv.pdf", document, function(err, document) {
      if(err) {
        throw err;
      }
      document.should.have.property('metadatas');
      document.should.have.property('binary_document_type', "pdf-html");
      document.metadatas.should.have.property('html');

      document.metadatas.html
        .should.include('Matt<span class="_ _0"></span>h<span class="_ _1"></span>i<span class="_ _0"></span>e<span class="_ _2"></span>u');
      done();
    });
  });
});
