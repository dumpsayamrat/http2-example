'use strict';

const http2 = require('http2');

const projectId = '...';    // declare your projectId here
const access_token = '...'; // and an access_token

const clientSession = http2.connect(`https://www.googleapis.com`);

const req = clientSession.request({
  ':path': `/bigquery/v2/projects/${projectId}/datasets`,
  'authorization': `Bearer ${access_token}`,
});
req.on('response', (headers, flags) => {
  // may check and play with the http/2 response headers, and flags
  let data = '';
  req.on('data', chunk => { data += chunk; })
     .on('end', () => {
      const res = JSON.parse(data);
      // from here res.datasets have all the datasets
      console.log(`found ${res.datasets.length} datasets in project ${projectId}`);

      clientSession.destroy(); // try remove this line see what changed?
    });
});