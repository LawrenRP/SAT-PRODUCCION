function ensureContainers() {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(toastContainer);
  }

  let modalContainer = document.getElementById('custom-dialog-container');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'custom-dialog-container';
    modalContainer.className = 'fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200';
    document.body.appendChild(modalContainer);
  }

  return { toastContainer, modalContainer };
}

export function showToast(message, type = 'info', duration = 3500) {
  const { toastContainer } = ensureContainers();

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-start space-x-3 p-3.5 bg-white rounded-lg border shadow-lg transform transition-all duration-300 translate-y-4 opacity-0 text-xs';

  let iconHtml = '';
  let borderClass = '';

  if (type === 'success') {
    borderClass = 'border-emerald-200 border-l-4 border-l-emerald-500';
    iconHtml = `
      <div class="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-[16px] leading-none">check_circle</span>
      </div>
    `;
  } else if (type === 'error') {
    borderClass = 'border-red-200 border-l-4 border-l-[#CC142E]';
    iconHtml = `
      <div class="w-6 h-6 rounded-full bg-red-50 text-[#CC142E] flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-[16px] leading-none">error</span>
      </div>
    `;
  } else if (type === 'warning') {
    borderClass = 'border-amber-200 border-l-4 border-l-amber-500';
    iconHtml = `
      <div class="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-[16px] leading-none">warning</span>
      </div>
    `;
  } else {
    borderClass = 'border-slate-200 border-l-4 border-l-slate-700';
    iconHtml = `
      <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-[16px] leading-none">info</span>
      </div>
    `;
  }

  toast.className += ` ${borderClass}`;
  toast.innerHTML = `
    ${iconHtml}
    <div class="flex-1 text-slate-800 leading-snug pt-0.5 font-medium">
      ${message}
    </div>
    <button class="text-slate-400 hover:text-slate-700 p-0.5 leading-none transition" title="Cerrar">
      <span class="material-symbols-outlined text-sm leading-none">close</span>
    </button>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  const dismiss = () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  };

  const closeBtn = toast.querySelector('button');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

export function showConfirmModal({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false }) {
  return new Promise((resolve) => {
    const { modalContainer } = ensureContainers();

    const iconHtml = isDanger
      ? `<div class="w-10 h-10 rounded-full bg-red-100 text-[#CC142E] flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">delete_forever</span>
         </div>`
      : `<div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">help</span>
         </div>`;

    const confirmBtnClass = isDanger
      ? 'bg-[#CC142E] hover:bg-[#B50D30] text-white'
      : 'bg-slate-900 hover:bg-slate-800 text-white';

    modalContainer.innerHTML = `
      <div id="custom-modal-card" class="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full p-5 space-y-4 transform transition-all duration-200 scale-95 opacity-0">
        <div class="flex items-start space-x-3.5">
          ${iconHtml}
          <div class="space-y-1 flex-1">
            <h3 class="text-sm font-bold text-slate-900">${title}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">${message}</p>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button id="modal-btn-cancel" class="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
            ${cancelText}
          </button>
          <button id="modal-btn-confirm" class="px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition ${confirmBtnClass}">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    modalContainer.classList.remove('hidden');

    const card = document.getElementById('custom-modal-card');
    const btnCancel = document.getElementById('modal-btn-cancel');
    const btnConfirm = document.getElementById('modal-btn-confirm');

    requestAnimationFrame(() => {
      if (card) {
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
      }
    });

    if (btnCancel) btnCancel.focus();

    const cleanup = (confirmed) => {
      if (card) {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
      }
      setTimeout(() => {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
        resolve(confirmed);
      }, 150);
    };

    if (btnCancel) btnCancel.addEventListener('click', () => cleanup(false));
    if (btnConfirm) btnConfirm.addEventListener('click', () => cleanup(true));

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', handleKeyDown);
        cleanup(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

export function showAlertModal({ title, message, type = 'warning', buttonText = 'Entendido' }) {
  return new Promise((resolve) => {
    const { modalContainer } = ensureContainers();

    const iconHtml = type === 'warning'
      ? `<div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">warning</span>
         </div>`
      : `<div class="w-10 h-10 rounded-full bg-red-100 text-[#CC142E] flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">error</span>
         </div>`;

    modalContainer.innerHTML = `
      <div id="custom-modal-card" class="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full p-5 space-y-4 transform transition-all duration-200 scale-95 opacity-0">
        <div class="flex items-start space-x-3.5">
          ${iconHtml}
          <div class="space-y-1 flex-1">
            <h3 class="text-sm font-bold text-slate-900">${title}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">${message}</p>
          </div>
        </div>

        <div class="flex items-center justify-end pt-2 border-t border-slate-100">
          <button id="modal-btn-ok" class="px-4 py-1.5 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition">
            ${buttonText}
          </button>
        </div>
      </div>
    `;

    modalContainer.classList.remove('hidden');

    const card = document.getElementById('custom-modal-card');
    const btnOk = document.getElementById('modal-btn-ok');

    requestAnimationFrame(() => {
      if (card) {
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
      }
    });

    if (btnOk) btnOk.focus();

    const cleanup = () => {
      if (card) {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
      }
      setTimeout(() => {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
        resolve();
      }, 150);
    };

    if (btnOk) btnOk.addEventListener('click', cleanup);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        window.removeEventListener('keydown', handleKeyDown);
        cleanup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}
