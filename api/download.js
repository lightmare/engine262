'use strict';

const fetch = require('node-fetch');

const authorization = `Bearer ${process.env.GH_TOKEN}`;

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Allow': 'OPTIONS, GET' });
    res.end();
    return res;
  }
  if (req.method !== 'GET') {
    return res.status(405).send('405');
  }

  delete req.headers.host;
  return fetch('https://npm.pkg.github.com/@engine262/engine262', {
    headers: { ...req.headers, authorization },
  })
    .then((r) => r.json())
    .then((r) => {
      const latest = r['dist-tags'].latest;
      const selected = req.query.version || latest;
      if (!r.versions[selected]) {
        return res.status(404).end('no such version');
      }
      const link = r.versions[selected].dist.tarball;
      return fetch(link, {
        redirect: 'manual',
        headers: { authorization },
      }).then((r2) => {
        res.status(200);
        return res.json({
          latest,
          selected,
          tarball: r2.headers.get('location'),
        });
      });
    });
};
