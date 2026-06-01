// api/create-payment.js
// Vercel Serverless Function — corre en el SERVIDOR, nunca en el browser.
// El Access Token de Mercado Pago NUNCA llega al cliente.
//
// Setup:
//   1. En Vercel Dashboard → Settings → Environment Variables:
//      MP_ACCESS_TOKEN = APP_USR-tu-token-real
//   2. El browser llama a /api/create-payment con los items del carrito
//   3. Esta función crea la preferencia y devuelve solo el init_point (link de pago)

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // El token vive SOLO en variables de entorno del servidor — nunca en el código
  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    console.error('MP_ACCESS_TOKEN no configurado en variables de entorno de Vercel');
    return res.status(500).json({ error: 'Configuración de pago incompleta' });
  }

  try {
    const { items, payer, orderId, backUrls } = req.body;

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }
    if (!payer?.email) {
      return res.status(400).json({ error: 'Email del comprador requerido' });
    }

    // Construir la preferencia de pago para Mercado Pago
    const preference = {
      items: items.map(item => ({
        id:          String(item.id || item.productId),
        title:       String(item.name).substring(0, 256),
        quantity:    Number(item.qty) || 1,
        unit_price:  Number(item.price),
        currency_id: 'ARS',
      })),
      payer: {
        email: payer.email,
        name:  payer.name  || '',
      },
      back_urls: {
        success: backUrls?.success || `${req.headers.origin || 'https://xinco.vercel.app'}/?payment=success`,
        failure: backUrls?.failure || `${req.headers.origin || 'https://xinco.vercel.app'}/?payment=failure`,
        pending: backUrls?.pending || `${req.headers.origin || 'https://xinco.vercel.app'}/?payment=pending`,
      },
      auto_return:        'approved',
      external_reference: orderId || ('ORD-' + Date.now()),
      statement_descriptor: 'XINCO TIENDA',
    };

    // Llamar a la API de Mercado Pago (con el token secreto — solo server lo ve)
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const errorData = await mpRes.json().catch(() => ({}));
      console.error('Error de Mercado Pago:', mpRes.status, errorData);
      return res.status(502).json({
        error:   'Error al crear preferencia de pago',
        details: errorData?.message || mpRes.statusText,
      });
    }

    const mpData = await mpRes.json();

    // Al browser solo le mandamos lo que NECESITA — nunca el token
    return res.status(200).json({
      id:          mpData.id,
      init_point:  mpData.init_point,       // link de pago real (producción)
      sandbox_url: mpData.sandbox_init_point, // link de prueba
    });

  } catch (err) {
    console.error('Error interno en create-payment:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
