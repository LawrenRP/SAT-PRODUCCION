import { STORAGE_KEY, REGULAR_WEEKS } from './constants.js';
import { ApiService } from './services/apiService.js';

export const AppState = {
  currentStep: 1,
  activeUnitId: 'u1',
  activeGradeWeek: '4',
  analysisCutoffWeek: 4,
  currentCourseId: null,
  courses: [],
  activeFilter: 'all',
  crudPage: 1,
  gradesPage: 1,
  dashboardPage: 1,
  activeChartSlide: 0,
  charts: {
    donut: null,
    scatter: null,
    pareto: null,
    histogram: null,
  }
};

export function getCurrentCourse() {
  if (AppState.courses.length === 0) return null;
  let course = AppState.courses.find(c => c.id === AppState.currentCourseId);
  if (!course) {
    course = AppState.courses[0];
    AppState.currentCourseId = course.id;
  }
  return course;
}

export function saveStateToStorage() {
  try {
    const dataToSave = {
      currentCourseId: AppState.currentCourseId,
      courses: AppState.courses,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }

  if (ApiService.isAuthenticated()) {
    syncActiveCourseToBackend();
  }
}

async function syncActiveCourseToBackend() {
  const current = getCurrentCourse();
  if (!current) return;

  try {
    if (current.backendId) {
      await ApiService.updateCourse(current.backendId, current);
    } else {
      const created = await ApiService.createCourse(current);
      if (created && created.id) {
        current.backendId = created.id;
        const dataToSave = {
          currentCourseId: AppState.currentCourseId,
          courses: AppState.courses,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      }
    }
  } catch (err) {
    console.warn('[Sync] Error al sincronizar curso activo con backend:', err.message);
  }
}

export async function syncStateWithBackend() {
  if (!ApiService.isAuthenticated()) return;
  try {
    const backendCourses = await ApiService.getCourses();
    AppState.courses = backendCourses.map(bc => {
      let studentsList = [];
      if (Array.isArray(bc.datos_alumnos)) {
        studentsList = bc.datos_alumnos;
      } else if (typeof bc.datos_alumnos === 'string') {
        try {
          studentsList = JSON.parse(bc.datos_alumnos);
        } catch (e) {
          studentsList = [];
        }
      }
      return {
        id: bc.codigo_seccion,
        backendId: bc.id,
        name: bc.nombre_curso,
        section: bc.codigo_seccion,
        sessionsPerWeek: bc.sesiones_semana,
        hasParticipation: bc.tiene_participacion !== false,
        hasTasks: bc.tiene_tareas !== false,
        semanaCorte: bc.semana_corte,
        students: studentsList,
        analyticsResults: []
      };
    });
    AppState.currentCourseId = AppState.courses[0] ? AppState.courses[0].id : null;
    
    const dataToSave = {
      currentCourseId: AppState.currentCourseId,
      courses: AppState.courses,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.warn('[Sync] No se pudieron obtener los cursos del backend:', err.message);
  }
}

export function loadStateFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.courses)) {
        AppState.courses = parsed.courses;
        AppState.currentCourseId = parsed.currentCourseId || (AppState.courses[0] ? AppState.courses[0].id : null);
        return;
      }
    } catch (e) {
      console.warn('Error al leer localStorage:', e);
    }
  }

  AppState.courses = [];
  AppState.currentCourseId = null;
}

export function createEmptyStudent(codigo = '', nombre = '') {
  const cleanNombre = typeof nombre === 'string' ? nombre.replace(/[0-9]/g, '').trim() : '';

  const student = {
    id: 'std_' + Math.random().toString(36).substring(2, 11),
    codigo: codigo ? codigo.trim() : '',
    nombre: cleanNombre,
    pc1: '',
    pc2: '',
    pc3: '',
    pa: '',
    pc4: '',
  };

  REGULAR_WEEKS.forEach(w => {
    student[`asist_s${w}`] = '';
    student[`tarea_s${w}`] = '';
    student[`foro_s${w}`] = '';
  });

  return student;
}
