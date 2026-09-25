import { AppState, loadStateFromStorage, saveStateToStorage, getCurrentCourse, syncStateWithBackend } from './state.js';
import { setupInitialCourseCreation } from './components/initialCourseView.js';
import { setupCourseControls, updateActiveCourseUI } from './components/courseBar.js';
import { setupStep1Crud, renderCrudTable } from './components/crudView.js';
import { setupStep2Grades, renderGradesTable, renderUnitAndWeekSelectors } from './components/gradesView.js';
import { setupStep3Dashboard, renderDashboard } from './components/dashboardView.js';
import { setupAuthUI } from './components/authModal.js';
import { ApiService } from './services/apiService.js';
import { showToast } from './components/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  loadStateFromStorage();

  setupAuthUI({
    onLoginSuccess: async (docente) => {
      await syncStateWithBackend();
      refreshAppView();
    },
    onLogout: () => {
      AppState.courses = [];
      AppState.currentCourseId = null;
      saveStateToStorage();
      refreshAppView();
    }
  });

  if (ApiService.isAuthenticated()) {
    try {
      await syncStateWithBackend();
    } catch (e) {
      console.warn('Inicio offline:', e.message);
    }
  }

  setupInitialCourseCreation(() => {
    refreshAppView();
    goToStep(1);
  });

  setupCourseControls({
    onCourseChanged: (course) => {
      if (!course || !course.students || course.students.length === 0) {
        AppState.currentStep = 1;
        AppState.crudPage = 1;
      }
      updateActiveCourseUI(renderCurrentStep);
      goToStep(AppState.currentStep || 1);
    },
    onCourseCreated: () => {
      AppState.currentStep = 1;
      AppState.crudPage = 1;
      refreshAppView();
      goToStep(1);
    },
    onCourseDeleted: () => {
      AppState.currentStep = 1;
      AppState.crudPage = 1;
      refreshAppView();
      goToStep(1);
    },
    onRenderCurrentStep: () => {
      renderCurrentStep();
    }
  });

  setupNavigation();

  setupStep1Crud({
    onNavigateToStep2: () => goToStep(2)
  });

  setupStep2Grades({
    onBackToStep1: () => goToStep(1),
    onNavigateToStep3: () => goToStep(3),
    onCourseUpdated: () => updateActiveCourseUI(renderCurrentStep)
  });

  setupStep3Dashboard({
    onBackToStep2: () => goToStep(2)
  });

  refreshAppView();
});

export function refreshAppView() {
  const viewAuthGate = document.getElementById('view-auth-gate');
  const viewInit = document.getElementById('view-initial-course');
  const courseBar = document.getElementById('course-bar');
  const stepperNav = document.getElementById('stepper-nav');
  const btnOpenLogin = document.getElementById('btn-open-login');
  const isAuth = ApiService.isAuthenticated();

  if (!isAuth) {
    if (viewAuthGate) viewAuthGate.classList.remove('hidden');
    if (viewInit) viewInit.classList.add('hidden');
    if (courseBar) courseBar.classList.add('hidden');
    if (stepperNav) stepperNav.classList.add('hidden');
    if (btnOpenLogin) btnOpenLogin.classList.add('hidden');
    hideAllStepViews();
    return;
  }

  if (viewAuthGate) viewAuthGate.classList.add('hidden');

  const user = ApiService.getCurrentUser();
  const initDocenteName = document.getElementById('init-docente-name');
  if (initDocenteName && user) {
    initDocenteName.textContent = user.nombre_completo || 'Docente';
  }

  if (AppState.courses.length === 0) {
    if (viewInit) viewInit.classList.remove('hidden');
    if (courseBar) courseBar.classList.add('hidden');
    if (stepperNav) stepperNav.classList.add('hidden');
    hideAllStepViews();
    return;
  }

  if (viewInit) viewInit.classList.add('hidden');
  if (courseBar) courseBar.classList.remove('hidden');
  if (stepperNav) stepperNav.classList.remove('hidden');
  updateActiveCourseUI(renderCurrentStep);
  goToStep(AppState.currentStep || 1);
}

function setupNavigation() {
  const navBtns = [
    { id: 'nav-step-1', step: 1 },
    { id: 'nav-step-2', step: 2 },
    { id: 'nav-step-3', step: 3 },
  ];

  navBtns.forEach(({ id, step }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => goToStep(step));
    }
  });
}

export function goToStep(step) {
  if (AppState.courses.length === 0) return;

  const current = getCurrentCourse();
  if (!current) return;

  if (step > 1 && (!current.students || current.students.length === 0)) {
    showToast(`El curso "${current.name}" aún no tiene estudiantes. Agrega alumnos en la Nómina para continuar.`, 'warning');
    step = 1;
  }

  AppState.currentStep = step;

  [1, 2, 3].forEach(s => {
    const navBtn = document.getElementById(`nav-step-${s}`);
    if (navBtn) {
      if (s === step) {
        navBtn.className = 'step-nav-btn active px-2.5 sm:px-3 py-1 rounded bg-white text-slate-900 font-semibold shadow-2xs transition inline-flex items-center gap-1.5';
      } else {
        navBtn.className = 'step-nav-btn px-2.5 sm:px-3 py-1 rounded text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-1.5';
      }
    }
  });

  hideAllStepViews();

  if (step === 1) {
    const viewCrud = document.getElementById('view-crud');
    if (viewCrud) viewCrud.classList.remove('hidden');
    renderCrudTable();
  } else if (step === 2) {
    const viewGrades = document.getElementById('view-grades');
    if (viewGrades) viewGrades.classList.remove('hidden');
    renderUnitAndWeekSelectors();
    renderGradesTable();
  } else if (step === 3) {
    const viewDash = document.getElementById('view-dashboard');
    if (viewDash) viewDash.classList.remove('hidden');
    renderDashboard();
  }
}

function hideAllStepViews() {
  const v1 = document.getElementById('view-crud');
  const v2 = document.getElementById('view-grades');
  const v3 = document.getElementById('view-dashboard');
  if (v1) v1.classList.add('hidden');
  if (v2) v2.classList.add('hidden');
  if (v3) v3.classList.add('hidden');
}

function renderCurrentStep() {
  if (AppState.currentStep === 1) renderCrudTable();
  else if (AppState.currentStep === 2) renderGradesTable();
  else if (AppState.currentStep === 3) renderDashboard();
}
