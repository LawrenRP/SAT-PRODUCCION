import { AppState, getCurrentCourse, saveStateToStorage, createEmptyStudent } from '../state.js';
import { downloadOfficialTemplate, exportStudentsToExcel, parseUploadedExcel } from '../services/excelService.js';
import { PAGE_SIZE } from '../constants.js';
import { updateStepNavLock } from './courseBar.js';
import { showToast, showConfirmModal } from './notifications.js';

export function setupStep1Crud(callbacks = {}) {
  const { onNavigateToStep2 } = callbacks;

  const inputCode = document.getElementById('input-new-code');
  const inputName = document.getElementById('input-new-name');
  const btnAdd = document.getElementById('btn-add-student');
  const btnBatch = document.getElementById('btn-create-batch');
  const btnClearAll = document.getElementById('btn-clear-all-students');
  const btnDownloadTemplate = document.getElementById('btn-download-empty-template');
  const btnExportExcel = document.getElementById('btn-export-students-excel');
  const btnNext = document.getElementById('btn-goto-step-2');

  const dropzone = document.getElementById('dropzone-excel-import');
  const fileInput = document.getElementById('file-input-excel');

  if (inputName) {
    inputName.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[0-9]/g, '');
    });
  }

  const handleAdd = () => {
    const code = inputCode.value.trim();
    let name = inputName.value.trim();

    if (/\d/.test(name)) {
      showToast('El campo "Apellidos y Nombres" no puede contener números.', 'warning');
      inputName.value = name.replace(/[0-9]/g, '');
      inputName.focus();
      return;
    }

    if (!code && !name) {
      inputCode.focus();
      return;
    }

    const current = getCurrentCourse();
    if (!current) return;

    current.students.push(createEmptyStudent(code, name));
    saveStateToStorage();

    AppState.crudPage = Math.ceil(current.students.length / PAGE_SIZE) || 1;

    inputCode.value = '';
    inputName.value = '';
    renderCrudTable();
    inputCode.focus();
  };

  if (btnAdd) btnAdd.addEventListener('click', handleAdd);
  if (inputName) {
    inputName.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAdd();
    });
  }
  if (inputCode) {
    inputCode.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') inputName.focus();
    });
  }

  if (btnBatch) {
    btnBatch.addEventListener('click', () => {
      const current = getCurrentCourse();
      if (!current) return;

      const countInput = parseInt(document.getElementById('input-batch-count').value, 10);
      const count = isNaN(countInput) || countInput < 1 ? 5 : Math.min(countInput, 100);

      for (let i = 0; i < count; i++) {
        current.students.push(createEmptyStudent());
      }
      saveStateToStorage();
      AppState.crudPage = Math.ceil(current.students.length / PAGE_SIZE) || 1;
      renderCrudTable();
    });
  }

  if (btnClearAll) {
    btnClearAll.addEventListener('click', async () => {
      const current = getCurrentCourse();
      if (!current) return;

      const confirmed = await showConfirmModal({
        title: '¿Vaciar nómina?',
        message: `¿Estás seguro de vaciar toda la nómina de "${current.name}"? Se eliminarán los estudiantes registrados.`,
        confirmText: 'Sí, vaciar',
        cancelText: 'Cancelar',
        isDanger: true,
      });

      if (confirmed) {
        current.students = [];
        AppState.crudPage = 1;
        saveStateToStorage();
        renderCrudTable();
        showToast('Nómina vaciada correctamente.', 'info');
      }
    });
  }

  if (btnDownloadTemplate) {
    btnDownloadTemplate.addEventListener('click', () => {
      downloadOfficialTemplate();
    });
  }

  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      exportStudentsToExcel(getCurrentCourse());
    });
  }

  if (btnNext && onNavigateToStep2) {
    btnNext.addEventListener('click', () => {
      onNavigateToStep2();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-[#CC142E]', 'bg-red-50/40');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-[#CC142E]', 'bg-red-50/40');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-[#CC142E]', 'bg-red-50/40');
      if (e.dataTransfer.files.length > 0) {
        handleFileImport(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileImport(e.target.files[0]);
      }
    });
  }
}

function handleFileImport(file) {
  const current = getCurrentCourse();
  if (!current) {
    showToast('Primero debes crear un curso y sección antes de importar alumnos.', 'warning');
    return;
  }

  parseUploadedExcel(
    file,
    current,
    (imported) => {
      AppState.crudPage = 1;
      saveStateToStorage();
      renderCrudTable();
      showToast(`Se importaron ${imported.length} estudiantes correctamente.`, 'success');
    },
    (err) => showToast(err, 'error')
  );
}

export function renderCrudTable() {
  const current = getCurrentCourse();
  const tbody = document.getElementById('crud-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const total = current ? current.students.length : 0;
  const countEl = document.getElementById('crud-total-count');
  if (countEl) countEl.textContent = total;

  if (!current || total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-8 text-center text-slate-400">
          No hay estudiantes en este curso. Agrega alumnos arriba o arrastra tu plantilla Excel.
        </td>
      </tr>
    `;
    renderCrudPagination(0, 1);
    updateStepNavLock();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (AppState.crudPage > totalPages) AppState.crudPage = totalPages;
  if (AppState.crudPage < 1) AppState.crudPage = 1;

  const startIdx = (AppState.crudPage - 1) * PAGE_SIZE;
  const pageStudents = current.students.slice(startIdx, startIdx + PAGE_SIZE);

  pageStudents.forEach((s, idx) => {
    const globalIdx = startIdx + idx + 1;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/70 border-b border-slate-100 transition-colors';

    tr.innerHTML = `
      <td class="px-3 py-2 text-center font-mono text-xs text-slate-400">${globalIdx}</td>
      <td class="px-2.5 py-1.5">
        <input type="text" data-id="${s.id}" data-field="codigo" value="${s.codigo || ''}" placeholder="Ej: U202114501" class="crud-input font-mono text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded w-full focus:bg-white focus:outline-none focus:border-slate-400">
      </td>
      <td class="px-2.5 py-1.5">
        <input type="text" data-id="${s.id}" data-field="nombre" value="${s.nombre || ''}" placeholder="Apellidos y Nombres" class="crud-input text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded w-full focus:bg-white focus:outline-none focus:border-slate-400">
      </td>
      <td class="px-3 py-1.5 text-center">
        <button data-delete-id="${s.id}" class="btn-delete-student text-slate-400 hover:text-[#CC142E] p-1 transition rounded hover:bg-red-50" title="Eliminar estudiante">
          <span class="material-symbols-outlined text-[16px] leading-none">delete</span>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  renderCrudPagination(total, totalPages);
  attachCrudInputListeners();
  updateStepNavLock();
}

function renderCrudPagination(total, totalPages) {
  let paginationContainer = document.getElementById('crud-pagination-container');
  if (!paginationContainer) {
    const footer = document.querySelector('#view-crud .bg-slate-50.border-t');
    if (footer) {
      paginationContainer = document.createElement('div');
      paginationContainer.id = 'crud-pagination-container';
      paginationContainer.className = 'flex items-center space-x-1.5';
      footer.appendChild(paginationContainer);
    }
  }

  if (!paginationContainer) return;
  paginationContainer.innerHTML = '';

  if (total <= PAGE_SIZE) {
    paginationContainer.classList.add('hidden');
    return;
  }
  paginationContainer.classList.remove('hidden');

  const currentPage = AppState.crudPage;

  const btnPrev = document.createElement('button');
  btnPrev.className = `px-2 py-0.5 rounded text-xs border font-medium inline-flex items-center gap-1 ${currentPage === 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`;
  btnPrev.innerHTML = '<span class="material-symbols-outlined text-xs leading-none">chevron_left</span> Anterior';
  btnPrev.disabled = currentPage === 1;
  btnPrev.addEventListener('click', () => {
    if (AppState.crudPage > 1) {
      AppState.crudPage--;
      renderCrudTable();
    }
  });
  paginationContainer.appendChild(btnPrev);

  const pageLabel = document.createElement('span');
  pageLabel.className = 'text-xs text-slate-600 font-mono px-2';
  pageLabel.textContent = `Pág. ${currentPage} de ${totalPages}`;
  paginationContainer.appendChild(pageLabel);

  const btnNext = document.createElement('button');
  btnNext.className = `px-2 py-0.5 rounded text-xs border font-medium inline-flex items-center gap-1 ${currentPage === totalPages ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`;
  btnNext.innerHTML = 'Siguiente <span class="material-symbols-outlined text-xs leading-none">chevron_right</span>';
  btnNext.disabled = currentPage === totalPages;
  btnNext.addEventListener('click', () => {
    if (AppState.crudPage < totalPages) {
      AppState.crudPage++;
      renderCrudTable();
    }
  });
  paginationContainer.appendChild(btnNext);
}

function attachCrudInputListeners() {
  const current = getCurrentCourse();
  if (!current) return;

  const inputs = document.querySelectorAll('.crud-input');
  inputs.forEach(input => {
    if (input.dataset.field === 'nombre') {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[0-9]/g, '');
      });
    }

    input.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const field = e.target.dataset.field;
      const student = current.students.find(s => s.id === id);
      if (student) {
        let val = e.target.value;
        if (field === 'nombre') {
          val = val.replace(/[0-9]/g, '').trim();
          e.target.value = val;
        }
        student[field] = val;
        saveStateToStorage();
      }
    });
  });

  const deleteBtns = document.querySelectorAll('.btn-delete-student');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.deleteId;
      current.students = current.students.filter(s => s.id !== id);
      saveStateToStorage();
      renderCrudTable();
    });
  });
}
