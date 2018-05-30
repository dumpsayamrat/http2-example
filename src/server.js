'use strict'

const http2 = require('http2');
const fs = require('fs');
const fsPromise = fs.promises;
const path = require('path')
const helper = require('./helper')
const { HTTP2_HEADER_PATH } = http2.constants

const PUBLIC_PATH = path.join(__dirname, '../public')
const SSL_PATH = path.join(__dirname, '../ssl')
let publicFiles = helper.getFiles(PUBLIC_PATH)

function push(stream, path) {
  const file = publicFiles.get(path);
  if (!file) {
    return
  }
  stream.pushStream({ [HTTP2_HEADER_PATH]: path }, (err, pushStream, headers) => {
    if (err) {
      console.error(err);
      return;
    };
    file.headers.let = '123'
    pushStream.respondWithFD(file.fileDescriptor, file.headers)
    // pushStream.respond({ ':status': 200 });
    // pushStream.end('content');
  })
}

const server = http2.createSecureServer({
  key: fs.readFileSync(SSL_PATH + '/server.key'),
  cert: fs.readFileSync(SSL_PATH + '/server.crt')
});

server.on('stream', (stream, headers) => {
  console.log(headers[':path'])
  const reqPath = headers[':path'] === '/' ? '/index.html' : headers[':path']
  const file = publicFiles.get(headers[':path']);
  // console.dir(reqPath);
  
  if(!file) {
    stream.statusCode = 404
    stream.end()
    return
  }

  if (reqPath === '/index.html') {
    // push(stream, '/app.js')
    push(stream, '/app2.js')
    push(stream, '/app.css')
  }

  stream.respondWithFD(file.fileDescriptor, file.headers)
})

server.on('error', (err) => console.error(err));

server.listen(3030);
