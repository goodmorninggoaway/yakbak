// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

var subject = require('../lib/record');
var assert = require('assert');
var mock = require('mock-fs');
var http = require('http');
var fs = require('fs');

var fixture = [
  'var path = require("path");',
  '',
  '/**',
  ' * GET /',
  ' *',
  ' * host: {addr}:{port}',
  ' * user-agent: My User Agent/1.0',
  ' * connection: close',
  ' */',
  '',
  'module.exports = function (req, res) {',
  '  res.statusCode = 201;',
  '',
  '  res.setHeader("content-type", "text/html");',
  '  res.setHeader("date", "Sat, 26 Oct 1985 08:20:00 GMT");',
  '  res.setHeader("connection", "close");',
  '  res.setHeader("transfer-encoding", "chunked");',
  '',
  '  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));',
  '',
  '  res.write(new Buffer("T0s=", "base64"));',
  '  res.end();',
  '',
  '  return __filename;',
  '};',
  ''
].join('\n');

describe('record', function () {
  var req;

  beforeEach(function () {
    req = http.request({
      host: this.addr,
      port: this.port,
    });
    req.setHeader('User-Agent', 'My User Agent/1.0')
    req.setHeader('Connection', 'close');
  });

  beforeEach(function () {
    mock({ '/tapes': {} });
  });

  afterEach(function () {
    mock.restore();
  });

  it('returns the filename', function (done) {
    req.on('response', function (res) {
      subject(req, res, '/tapes/foo.js').then(function (filename) {
        assert.equal(filename, '/tapes/foo.js');
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    req.end();
  });

  it('records the response to disk', function (done) {
    var addr = this.addr;
    var port = this.port;

    var expected = fixture.replace('{addr}', addr).replace('{port}', port);

    req.on('response', function (res) {
      subject(req, res, '/tapes/foo.js').then(function (filename) {
        assert.equal(fs.readFileSync(filename, 'utf8'), expected);
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    req.end();
  });

});