/**
 * Script para setear custom claims de admin en Firebase Auth.
 *
 * Uso:
 *   1. Firebase Console → Project Settings → Service Accounts →
 *      "Generate new private key" → guardar como serviceAccountKey.json
 *      en esta misma carpeta (scripts/)
 *
 *   2. npm install firebase-admin
 *
 *   3. node scripts/set-admin-claims.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const ADMIN_EMAILS = [
  'xinco.tienda.adm@gmail.com',
  'eitan.lazkano5@gmail.com',
  'admin@xinco.com',
  'eitanlazkano2010@gmail.com',
];

async function setClaims() {
  for (const email of ADMIN_EMAILS) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`✅ ${email} → admin claim seteado`);
    } catch (err) {
      console.error(`❌ ${email} → error:`, err.message);
    }
  }
  console.log('\n✔ Listo. Los admines ahora tienen admin: true en sus claims.');
  process.exit(0);
}

setClaims();
