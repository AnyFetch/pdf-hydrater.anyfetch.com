'use strict';

require('should');

var pdf = require('../lib/');
var fs = require('fs');

describe('Test pdf results', function() {
  it('returns the correct informations', function(done) {
    var document = {
      datas: {}
    };

    pdf(__dirname + "/samples/cv.pdf", document, function(err, document) {
      if(err) {
        throw err;
      }
      document.should.have.property('datas');
      document.should.have.property('document_type', "document");
      document.datas.should.have.property('html');

      document.datas.html
        .should.include('Matt<span class="_ _0"></span>h<span class="_ _1"></span>i<span class="_ _0"></span>e<span class="_ _2"></span>u');
      done();
    });
  });

  it.only('returns the correct informationsazzer', function(done) {
    var document = {
      datas: {}
    };

    pdf("/media/amoki/8EB6E5E5B6E5CDB1/CHU/Nouveau\\ dossier/chu.pdf", document, function(err, document) {
      if(err) {
        throw err;
      }
      document.should.have.property('datas');
      document.should.have.property('document_type', "document");
      document.datas.should.have.property('html');

      fs.writeFileSync('/tmp/chu.html', document.datas.html);
      done();
    });
  });
});
