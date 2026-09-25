import { AppState, getCurrentCourse, saveStateToStorage } from '../state.js';
import { showToast, showConfirmModal } from './notifications.js';
import { ApiService } from '../services/apiService.js';

export function setupCourseControls(callbacks = {}) {
  const { onCourseChanged, onCourseCreated, onCourseDeleted, onRenderCurrentStep } = callbacks;

  const selectDropdown = document.getElementById('select-course-dropdown');
  const btnOpenModal = document.getElementById('btn-open-modal-course');
  const btnCloseModal = document.getElementById('btn-close-modal-course');
  const btnCancelCourse = document.getElementById('btn-cancel-course');
  const btnSaveCourse = document.getElementById('btn-save-course');
  const btnDeleteCourse = document.getElementById('btn-delete-course');
  const modal = document.getElementById('modal-new-course');

  if (selectDropdown) {
    selectDropdown.addEventListener('change', (e) => {
      AppState.currentCourseId = e.target.value;
      const current = getCurrentCourse();

      if (!current || !current.students || current.students.length === 0) {
        AppState.currentStep = 1;
        AppState.crudPage = 1;
      }

      saveStateToStorage();
      if (onCourseChanged) {
        onCourseChanged(current);
      } else {
        updateActiveCourseUI(onRenderCurrentStep);
      }
    });
  }

  if (btnOpenModal && modal) {
    btnOpenModal.addEventListener('click', () => {
      document.getElementById('input-course-name').value = '';
      document.getElementById('input-course-section').value = '';
      document.getElementById('input-course-sessions').value = '2';
      modal.classList.remove('hidden');
      document.getElementById('input-course-name').focus();
    });

    const closeModal = () => modal.classList.add('hidden');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelCourse) btnCancelCourse.addEventListener('click', closeModal);

    if (btnSaveCourse) {
      btnSaveCourse.addEventListener('click', () => {
        const name = document.getElementById('input-course-name').value.trim();
        const section = document.getElementById('input-course-section').value.trim();
        const sessions = parseInt(document.getElementById('input-course-sessions').value, 10);

        if (!name || !section) {
          showToast('Ingresa el nombre del curso y el código de sección.', 'warning');
          return;
        }

        const exists = AppState.courses.some(c => c.section.toLowerCase() === section.toLowerCase());
        if (exists) {
          showToast(`Ya existe un curso registrado con la sección "${section}". Cada sección debe ser única.`, 'warning');
          return;
        }

        const newCourse = {
          id: section,
          name: name,
          section: section,
          sessionsPerWeek: sessions,
          hasParticipation: true,
          students: [],
          analyticsResults: [],
        };

        AppState.courses.push(newCourse);
        AppState.currentCourseId = newCourse.id;

        AppState.currentStep = 1;
        AppState.crudPage = 1;

        saveStateToStorage();
        closeModal();

        if (onCourseCreated) {
          onCourseCreated(newCourse);
        } else {
          updateActiveCourseUI(onRenderCurrentStep);
        }

        showToast(`Curso "${name}" (Sección ${section}) creado con éxito.`, 'success');
      });
    }
  }

  if (btnDeleteCourse) {
    btnDeleteCourse.addEventListener('click', async () => {
      const current = getCurrentCourse();
      if (!current) return;

      const confirmed = await showConfirmModal({
        title: '¿Eliminar curso?',
        message: `¿Estás seguro de eliminar el curso "${current.name}" (Sección ${current.section})? Se borrarán sus datos y nómina asociada.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        isDanger: true,
      });

      if (confirmed) {
        if (current.backendId && ApiService.isAuthenticated()) {
          try {
            await ApiService.deleteCourse(current.backendId);
          } catch (e) {
            console.warn('[Backend] Error eliminando curso remoto:', e.message);
          }
        }

        AppState.courses = AppState.courses.filter(c => c.id !== current.id);
        AppState.currentCourseId = AppState.courses.length > 0 ? AppState.courses[0].id : null;
        AppState.currentStep = 1;
        AppState.crudPage = 1;

        saveStateToStorage();
        showToast(`Curso "${current.name}" eliminado correctamente.`, 'info');
        if (onCourseDeleted) onCourseDeleted();
      }
    });
  }
}

export function updateActiveCourseUI(onRenderCurrentStep) {
  const current = getCurrentCourse();
  if (!current) return;

  const selectDropdown = document.getElementById('select-course-dropdown');
  if (selectDropdown) {
    selectDropdown.innerHTML = '';
    AppState.courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} — Sección ${c.section}`;
      if (c.id === AppState.currentCourseId) opt.selected = true;
      selectDropdown.appendChild(opt);
    });
  }

  const badgeSection = document.getElementById('badge-current-section');
  const labelCourseActive = document.getElementById('label-course-active-title');
  const labelGradesCourse = document.getElementById('label-grades-course-title');
  const badgeSessions = document.getElementById('badge-course-sessions');

  if (badgeSection) badgeSection.textContent = current.section;
  if (labelCourseActive) labelCourseActive.textContent = `${current.name} (Sec. ${current.section})`;
  if (labelGradesCourse) labelGradesCourse.textContent = `${current.name} (Sec. ${current.section})`;

  if (badgeSessions) {
    badgeSessions.textContent = current.sessionsPerWeek === 1
      ? '1 Sesión/sem'
      : '2 Sesiones/sem';
    badgeSessions.title = current.sessionsPerWeek === 1
      ? 'Modalidad: 1 Sesión semanal'
      : 'Modalidad: 2 Sesiones semanales (Teoría + Práctica)';
  }

  updateStepNavLock();

  if (onRenderCurrentStep) onRenderCurrentStep();
}

export function updateStepNavLock() {
  const current = getCurrentCourse();
  const hasStudents = current && current.students && current.students.length > 0;
  const navStep2 = document.getElementById('nav-step-2');
  const navStep3 = document.getElementById('nav-step-3');

  if (navStep2) {
    if (!hasStudents) {
      navStep2.classList.add('opacity-40');
      navStep2.title = 'Primero debes agregar alumnos en la lista (Paso 1)';
    } else {
      navStep2.classList.remove('opacity-40');
      navStep2.title = '2. Calificaciones Semanales';
    }
  }

  if (navStep3) {
    if (!hasStudents) {
      navStep3.classList.add('opacity-40');
      navStep3.title = 'Primero debes agregar alumnos en la lista (Paso 1)';
    } else {
      navStep3.classList.remove('opacity-40');
      navStep3.title = '3. Alertas y Diagnóstico';
    }
  }
}
