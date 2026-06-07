import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = 'damwe7juy';

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary API credentials not configured' });
  }

  const folder = req.query.folder || 'HOME/XINCO-TIENDA/ADMINPANEL/BACKGROUND';
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha256').update(params).digest('hex');

  return res.status(200).json({
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder,
  });
}
