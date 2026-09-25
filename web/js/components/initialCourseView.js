import { AppState, saveStateToStorage } from '../state.js';
import { showToast } from './notifications.js';

export function setupInitialCourseCreation(onCourseCreated) {
  const btnInit = document.getElementById('btn-init-create-course');
  const inputName = document.getElementById('init-course-name');
  const inputSection = document.getElementById('init-course-section');
  const selectSessions = document.getElementById('init-course-sessions');

  if (!btnInit || !inputName || !inputSection) return;

  const handleInitCreate = () => {
    const name = inputName.value.trim();
    const section = inputSection.value.trim();
    const sessions = parseInt(selectSessions.value, 10);

    if (!name) {
      showToast('Por favor, ingresa el nombre de la asignatura o curso.', 'warning');
      inputName.focus();
      return;
    }

    if (!section) {
      showToast('Por favor, ingresa el código de sección oficial (NRC).', 'warning');
      inputSection.focus();
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

    saveStateToStorage();

    inputName.value = '';
    inputSection.value = '';

    if (onCourseCreated) onCourseCreated(newCourse);
  };

  btnInit.addEventListener('click', handleInitCreate);
  inputSection.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleInitCreate();
  });
}
