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

// fix Error [ERR_HTTP2_STREAM_ERROR]: Stream closed with error code NGHTTP2_REFUSED_STREAM
// by https://gist.github.com/ryzokuken/71392a6cc0a962b5c0ea0662e8a3ae6a
function push(stream, path) {
  const file = publicFiles.get(path);
  if (!file) {
    return
  }
  stream.pushStream({ [HTTP2_HEADER_PATH]: path }, { parent: stream.id }, (err, pushStream, headers) => {
    if (err) throw err
    pushStream.respondWithFD(file.fileDescriptor, file.headers)
    pushStream.end()
  })
}

const server = http2.createSecureServer({
  key: fs.readFileSync(SSL_PATH + '/server.key'),
  cert: fs.readFileSync(SSL_PATH + '/server.crt')
});

server.on('stream', (stream, headers) => {
  console.log(headers[':path'])
  const reqPath = headers[':path'] === '/' ? '/index.html' : headers[':path']
  const file = publicFiles.get(reqPath)

  if(!file) {
    stream.statusCode = 404
    stream.end()
    return
  }

  if (reqPath === '/index.html') {
    push(stream, '/styles.css')
    push(stream, '/app.js')
  }

  stream.respondWithFD(file.fileDescriptor, file.headers)
})

server.on('error', (err) => console.error(err))

server.listen(3030)
