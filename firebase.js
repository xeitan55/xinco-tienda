// =============================================
// XINCO — js/firebase.js
// Inicialización Firebase + todas las ops de DB
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, getDoc,
  setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---- Config ----
const firebaseConfig = {
  apiKey: "AIzaSyCHmbuWJM-vYeFm4WUXMTp716Kci26sr2w",
  authDomain: "xinco-tienda.firebaseapp.com",
  projectId: "xinco-tienda",
  storageBucket: "xinco-tienda.firebasestorage.app",
  messagingSenderId: "111454837862",
  appId: "1:111454837862:web:e64bb28970e0f7442c21a7",
  measurementId: "G-5ZT56GNN4X"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// =============================================
// PRODUCTOS
// =============================================
export async function fbGetProducts() {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fbSaveProduct(product) {
  if (product.id && typeof product.id === 'string' && product.id.length > 5) {
    // update existente
    const ref = doc(db, 'products', String(product.id));
    await setDoc(ref, product, { merge: true });
    return product.id;
  } else {
    // nuevo
    const ref = await addDoc(collection(db, 'products'), product);
    return ref.id;
  }
}

export async function fbDeleteProduct(id) {
  await deleteDoc(doc(db, 'products', String(id)));
}

// =============================================
// PEDIDOS
// =============================================
export async function fbGetOrders() {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fbSaveOrder(order) {
  const ref = await addDoc(collection(db, 'orders'), {
    ...order,
    createdAt: new Date().toISOString()
  });
  return ref.id;
}

export async function fbUpdateOrderStatus(id, status) {
  await updateDoc(doc(db, 'orders', String(id)), { status });
}

// =============================================
// BANNERS
// =============================================
export async function fbGetBanners() {
  const snap = await getDoc(doc(db, 'config', 'banners'));
  return snap.exists() ? snap.data() : null;
}

export async function fbSaveBanners(data) {
  await setDoc(doc(db, 'config', 'banners'), data);
}

// =============================================
// TRACKING
// =============================================
export async function fbGetTracking() {
  const snap = await getDocs(collection(db, 'tracking'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result;
}

export async function fbSaveTracking(orderId, data) {
  await setDoc(doc(db, 'tracking', String(orderId)), data);
}

// =============================================
// CONFIG (MP, banco)
// =============================================
export async function fbGetConfig(key) {
  const snap = await getDoc(doc(db, 'config', key));
  return snap.exists() ? snap.data() : null;
}

export async function fbSaveConfig(key, data) {
  await setDoc(doc(db, 'config', key), data);
}

// =============================================
// AUTH
// =============================================
export async function fbLogin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function fbRegister(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function fbLogout() {
  await signOut(auth);
}

export function fbOnAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function fbCurrentUser() {
  return auth.currentUser;
}

// =============================================
// EXPORT instancias base (para uso avanzado)
// =============================================
export { db, auth };
