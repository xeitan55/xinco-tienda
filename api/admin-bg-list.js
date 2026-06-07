export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel Environment Variables
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = 'damwe7juy';

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary API credentials not configured' });
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/video/upload?prefix=adminpanel/defaultbackgrounds/&max_results=10&type=upload`;

    const cloudRes = await fetch(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!cloudRes.ok) {
      const errText = await cloudRes.text();
      console.error('Cloudinary API error:', cloudRes.status, errText);
      return res.status(cloudRes.status).json({ error: 'Cloudinary API error' });
    }

    const data = await cloudRes.json();
    const resources = (data.resources || []).slice(0, 4).map(r => ({
      publicId: r.public_id,
      url: r.secure_url || r.url,
      format: r.format,
      bytes: r.bytes,
      createdAt: r.created_at,
    }));

    return res.status(200).json({ resources });
  } catch (error) {
    console.error('admin-bg-list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
