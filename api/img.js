module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
  } catch(e) {
    return res.status(400).json({ error: 'Invalid url' });
  }

  const allowedHosts = [
    'i.seadn.io',
    'ipfs.io',
    'cloudflare-ipfs.com',
    'ikzttp.mypinata.cloud',
    'gateway.pinata.cloud',
    'nftstorage.link',
    'arweave.net',
    'metadata.degods.com',
    'madlads.s3.us-west-2.amazonaws.com',
    'famousfoxes.com',
    'www.larvalabs.com',
    'live---metadata-5covpqijaa-uc.a.run.app',
    'api.pudgypenguins.io',
    'ordinals.com',
    'res.cloudinary.com',
    'lh3.googleusercontent.com',
    'storage.googleapis.com',
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch(e) {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  const hostAllowed = allowedHosts.some(function(h) {
    return parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.' + h);
  });

  if (!hostAllowed) {
    return res.status(403).json({ error: 'Host not allowed: ' + parsedUrl.hostname });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 NFTValley/1.0',
        'Accept': 'image/*,*/*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream: ' + response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    return res.status(200).send(Buffer.from(buffer));

  } catch(err) {
    return res.status(500).json({ error: 'Failed: ' + err.message });
  }
};
