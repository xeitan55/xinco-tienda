export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('MP_ACCESS_TOKEN no configurado en environment variables');
    return res.status(500).json({ error: 'Mercado Pago no configurado — contactá al administrador' });
  }

  try {
    const { orderId, items, payer, backUrls } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const preference = {
      external_reference: orderId,
      items: items.map(item => ({
        id: String(item.id),
        title: item.name,
        quantity: Number(item.qty),
        unit_price: Number(item.price),
        currency_id: 'ARS',
      })),
      payer: {
        email: payer?.email || '',
        name: payer?.name || '',
      },
      back_urls: {
        success: backUrls?.success || '',
        failure: backUrls?.failure || '',
        pending: backUrls?.pending || '',
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [],
        installments: 6,
      },
      notification_url: process.env.MP_NOTIFICATION_URL || '',
    };

    console.log('Creando preferencia MP para orden:', orderId);

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Error MP API:', mpRes.status, mpData);
      return res.status(mpRes.status).json({
        error: mpData.message || mpData.error || 'Error al crear el pago en Mercado Pago',
      });
    }

    console.log('Preferencia MP creada:', mpData.id, 'init_point:', mpData.init_point?.substring(0, 60));

    return res.status(200).json({
      init_point: mpData.init_point,
      preference_id: mpData.id,
    });
  } catch (error) {
    console.error('create-payment error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
