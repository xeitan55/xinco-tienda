// =============================================
// XINCO — js/cloudinary.js
// Subida de imágenes a Cloudinary (unsigned)
// =============================================

const CLOUD_NAME    = 'damwe7juy';
const UPLOAD_PRESET = 'XINCO TIENDA';
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export let uploadedImages = [];

/**
 * Sube un archivo a Cloudinary en modo unsigned.
 * @param {File} file
 * @param {Function} onProgress  (pct: number) => void
 * @param {Function} onSuccess   (url: string) => void
 * @param {Function} onError     (msg: string) => void
 */
export async function uploadImage(file, onProgress, onSuccess, onError) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { onError('El archivo supera los 10MB'); return; }
  if (!file.type.startsWith('image/')) { onError('Solo se permiten imágenes'); return; }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  // Sin timestamp, sin signature, sin api_key — modo unsigned puro

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL, true);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        const url = res.secure_url;
        uploadedImages.unshift({ url, name: file.name, public_id: res.public_id });
        onSuccess(url, res);
        resolve(url);
      } else {
        let msg = 'Error al subir';
        try { msg = JSON.parse(xhr.responseText).error?.message || msg; } catch(e) {}
        onError(msg);
        reject(msg);
      }
    };

    xhr.onerror = () => { onError('Error de conexión'); reject('Network error'); };
    xhr.send(formData);
  });
}

/**
 * Crea una zona de drop/click para subir imagen.
 * @param {string} dropzoneId   ID del elemento drop zone
 * @param {string} fileInputId  ID del input[type=file]
 * @param {Function} onUrl      Callback con la URL final
 */
export function setupImageUploader(dropzoneId, fileInputId, progressBarId, resultId, onUrl) {
  const dropzone  = document.getElementById(dropzoneId);
  const fileInput = document.getElementById(fileInputId);
  const bar       = document.getElementById(progressBarId);
  const resultEl  = document.getElementById(resultId);

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('bg-surface-container'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('bg-surface-container'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('bg-surface-container');
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleUpload(fileInput.files[0]);
  });

  function handleUpload(file) {
    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = ev => {
      const preview = document.getElementById(dropzoneId + '-preview');
      if (preview) { preview.src = ev.target.result; preview.classList.remove('hidden'); }
    };
    reader.readAsDataURL(file);

    uploadImage(file,
      pct => { if (bar) { bar.style.width = pct + '%'; bar.closest?.('.upload-progress')?.classList.remove('hidden'); } },
      url => {
        onUrl(url);
        if (resultEl) { resultEl.classList.remove('hidden'); resultEl.querySelector?.('.result-url')?.textContent = url; }
        if (bar) { bar.style.width = '100%'; bar.style.background = '#5d22ff'; }
      },
      err => { import('./ui.js').then(m => m.showToast('Error al subir: ' + err + ' ❌')); }
    );
  }
}
