import { state, fbDb } from './firebase.js';

let _reviewRating = 0;
let _reviewProductId = null;

export function loadReviews(productId) {
  _reviewProductId = productId;
  const list = document.getElementById('reviews-list');
  const countEl = document.getElementById('reviews-count');
  const empty = document.getElementById('reviews-empty');
  if (!list) return;
  list.innerHTML = '<div class="text-center py-8"><div class="skeleton w-8 h-8 mx-auto mb-4" style="border-radius:50%;"></div><div class="skeleton h-4 w-32 mx-auto"></div></div>';
  const btn = document.getElementById('review-btn');
  if (btn) btn.style.display = state.user ? '' : 'none';
  if (!fbDb || !window._fb) { list.innerHTML = ''; return; }
  const { collection, getDocs, query, orderBy } = window._fb;
  getDocs(query(collection(fbDb, 'reviews', String(productId), 'reviews'), orderBy('createdAt', 'desc')))
    .then(snap => {
      const reviews = [];
      snap.forEach(d => reviews.push({ id: d.id, ...d.data() }));
      renderReviews(reviews, list, countEl, empty);
    })
    .catch(() => { list.innerHTML = ''; });
}

export function renderReviews(reviews, list, countEl, empty) {
  if (!list) return;
  if (reviews.length === 0) {
    if (empty) empty.style.display = '';
    list.innerHTML = '';
    if (countEl) countEl.textContent = '0 OPINIONES';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (countEl) countEl.textContent = reviews.length + ' OPINION' + (reviews.length !== 1 ? 'ES' : '');
  list.innerHTML = reviews.map(r => `
    <div class="border-2 border-primary p-5">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-caps text-sm font-bold">${(r.userName||'A')[0].toUpperCase()}</div>
          <div>
            <div class="font-label-caps text-label-caps text-primary">${r.userName || 'Anónimo'}</div>
            <div class="flex items-center gap-2 text-[11px] text-on-surface-variant font-label-caps">
              <span>${new Date(r.createdAt?.toDate?.() || r.createdAt).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' })}</span>
              ${r.verified ? `<span class="text-secondary-container">● VERIFICADO</span>` : ''}
            </div>
          </div>
        </div>
        <div class="flex gap-0.5">
          ${Array.from({length:5},(_,i) => `<span class="text-sm ${i < r.rating ? 'text-primary' : 'text-outline-variant'}">★</span>`).join('')}
        </div>
      </div>
      ${r.title ? `<div class="font-label-caps text-label-caps text-primary mb-1 text-sm">${r.title}</div>` : ''}
      <p class="font-body-md text-on-surface-variant text-sm">${r.text}</p>
      ${r.delivery ? `<div class="flex items-center gap-2 mt-3 text-[11px] font-label-caps text-secondary-container"><span class="material-symbols-outlined text-[14px]">check_circle</span> ENVÍO CONFORME</div>` : ''}
    </div>
  `).join('');
}

export function openReviewForm() {
  if (!state.user) { window.showToast?.('INICIÁ SESIÓN PARA OPINAR ❌'); import('./router.js').then(m => m.nav('login')); return; }
  if (!_reviewProductId) return;
  _reviewRating = 0;
  document.getElementById('review-title').value = '';
  document.getElementById('review-text').value = '';
  document.getElementById('review-delivery').checked = false;
  document.querySelectorAll('#review-stars .star-rating').forEach(s => s.style.color = '');
  document.getElementById('review-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export function closeReviewForm() {
  document.getElementById('review-modal').style.display = 'none';
  document.body.style.overflow = '';
}

export async function submitReview() {
  if (!_reviewRating) { window.showToast?.('SELECCIONÁ UNA PUNTUACIÓN ❌'); return; }
  const title = document.getElementById('review-title').value.trim();
  const text = document.getElementById('review-text').value.trim();
  if (!text) { window.showToast?.('ESCRIBÍ TU OPINIÓN ❌'); return; }
  const delivery = document.getElementById('review-delivery').checked;
  const btn = document.getElementById('review-submit-btn');
  btn.disabled = true; btn.textContent = 'PUBLICANDO...';
  try {
    if (!fbDb || !window._fb) throw new Error('Firebase no disponible');
    const { addDoc, collection, doc, getDoc, setDoc, getDocs, query } = window._fb;
    const existing = await getDocs(query(collection(fbDb, 'reviews', String(_reviewProductId), 'reviews')));
    let alreadyReviewed = false;
    existing.forEach(d => { if (d.data().userId === state.user.uid) alreadyReviewed = true; });
    if (alreadyReviewed) { window.showToast?.('YA OPINASTE SOBRE ESTE PRODUCTO ❌'); btn.disabled = false; btn.textContent = 'PUBLICAR RESEÑA'; return; }
    const review = {
      userId: state.user.uid, userName: state.user.displayName || state.user.email?.split('@')[0] || 'Usuario',
      userPhoto: state.user.photoURL || '', rating: _reviewRating, title, text, delivery,
      verified: true, createdAt: new Date().toISOString()
    };
    await addDoc(collection(fbDb, 'reviews', String(_reviewProductId), 'reviews'), review);
    try {
      const prodRef = doc(fbDb, 'products', String(_reviewProductId));
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const curr = prodSnap.data().reviews || 0;
        await setDoc(prodRef, { reviews: curr + 1 }, { merge: true });
      }
    } catch(e) { console.warn('review: error updating product review count', e); }
    window.showToast?.('RESEÑA PUBLICADA ✅');
    closeReviewForm();
    loadReviews(_reviewProductId);
  } catch(e) {
    console.error('submitReview error:', e);
    window.showToast?.('ERROR AL PUBLICAR ❌');
  }
  btn.disabled = false; btn.textContent = 'PUBLICAR RESEÑA';
}

export function init() {
  window.loadReviews = loadReviews;
  window.openReviewForm = openReviewForm;
  window.closeReviewForm = closeReviewForm;
  window.submitReview = submitReview;

  document.addEventListener('click', function(e) {
    const star = e.target.closest('.star-rating');
    if (!star) return;
    const val = parseInt(star.dataset.val);
    _reviewRating = val;
    document.querySelectorAll('#review-stars .star-rating').forEach(s => {
      s.style.color = parseInt(s.dataset.val) <= val ? 'var(--primary)' : '';
    });
  });
}
