/**
 * NFT Valley — Image Proxy
 * Route: /api/img?url=<encoded_image_url>
 *
 * This runs on Vercel's server — no CORS restrictions.
 * Fetches any NFT image (OpenSea, IPFS, etc.) and serves it
 * back to the browser with Access-Control-Allow-Origin: *
 */

export default async function handler(req, res) {
  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Decode the URL
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  // Security: only allow image hosts we trust
  const allowedHosts = [
    'i.seadn.io',
    'ipfs.io',
    'cloudflare-ipfs.com',
    'cf-ipfs.com',
    'ikzttp.mypinata.cloud',
    'gateway.pinata.cloud',
    'nftstorage.link',
    'arweave.net',
    'metadata.degods.com',
    'madlads.s3.us-west-2.amazonaws.com',
    'famousfoxes.com',
    'www.larvalabs.com',
    'live---metadata-5covpqijaa-uc.a.run.app',
    'bafybeictt4g7iawvoq7rn3dtkavb2yqnxm3l6l5hccbbnaqn5epimrk3bu.ipfs.nftstorage.link',
    'api.pudgypenguins.io',
    'ordinals.com',
    'res.cloudinary.com',
    'lh3.googleusercontent.com',
    'storage.googleapis.com',
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  if (!allowedHosts.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.' + h))) {
    return res.status(403).json({ error: 'Host not allowed: ' + parsedUrl.hostname });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'NFTValley/1.0',
        'Accept': 'image/*,*/*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error: ' + response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);

    return res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    console.error('Image proxy error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
}
