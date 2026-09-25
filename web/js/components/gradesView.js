import { AppState, getCurrentCourse, saveStateToStorage } from '../state.js';
import { exportFullExcel } from '../services/excelService.js';
import { ACADEMIC_UNITS, REGULAR_WEEKS, EVALUATION_MILESTONES, PAGE_SIZE } from '../constants.js';
import { showToast } from './notifications.js';
import { calculateSuggestedPa } from '../services/analytics.js';

export function setupStep2Grades(callbacks = {}) {
  const { onBackToStep1, onNavigateToStep3, onCourseUpdated } = callbacks;

  const chkPart = document.getElementById('chk-eval-participacion');
  const btnBack = document.getElementById('btn-back-to-step-1');
  const btnNext = document.getElementById('btn-goto-step-3');
  const btnFillAttendance = document.getElementById('btn-fill-attendance-all');
  const btnExport = document.getElementById('btn-export-full-excel');

  const chkTasks = document.getElementById('chk-eval-tareas');
  if (chkTasks) {
    chkTasks.addEventListener('change', (e) => {
      const current = getCurrentCourse();
      if (!current) return;
      current.hasTasks = e.target.checked;
      saveStateToStorage();
      renderGradesTable();
      if (onCourseUpdated) onCourseUpdated();
    });
  }

  if (chkPart) {
    chkPart.addEventListener('change', (e) => {
      const current = getCurrentCourse();
      if (!current) return;
      current.hasParticipation = e.target.checked;
      saveStateToStorage();
      renderGradesTable();
      if (onCourseUpdated) onCourseUpdated();
    });
  }

  renderUnitAndWeekSelectors();

  if (btnFillAttendance) {
    btnFillAttendance.addEventListener('click', () => {
      const current = getCurrentCourse();
      if (!current) return;

      const fullVal = current.sessionsPerWeek || 1;
      const targetWeeks = getTargetWeeksForAttendance();

      if (targetWeeks.length === 0) {
        showToast('Selecciona una semana regular para marcar asistencia.', 'info');
        return;
      }

      current.students.forEach(s => {
        targetWeeks.forEach(w => {
          s[`asist_s${w}`] = fullVal;
        });
      });

      saveStateToStorage();
      renderGradesTable();
      showToast(`Asistencia marcada al 100% (${fullVal} sesión/es).`, 'success');
    });
  }

  const btnAutoPaToolbar = document.getElementById('btn-auto-calc-pa-toolbar');
  if (btnAutoPaToolbar) {
    btnAutoPaToolbar.addEventListener('click', () => {
      const current = getCurrentCourse();
      if (!current || !Array.isArray(current.students) || current.students.length === 0) {
        showToast('No hay estudiantes registrados en este curso.', 'warning');
        return;
      }
      const hasTasks = current.hasTasks !== false;
      const hasPart = current.hasParticipation !== false;

      if (!hasTasks && !hasPart) {
        showToast('Este curso no contempla evaluación continua (PA). Se evalúa 100% por exámenes.', 'info');
        return;
      }

      current.students.forEach(st => {
        st.pa = calculateSuggestedPa(st, hasPart, hasTasks);
      });
      saveStateToStorage();
      renderGradesTable();

      let toastMsg = '';
      if (hasTasks && hasPart) {
        toastMsg = 'Notas de PA (Semana 17) auto-calculadas: 50% Tareas + 50% Foros';
      } else if (hasTasks && !hasPart) {
        toastMsg = 'Notas de PA (Semana 17) auto-calculadas: 100% Tareas Semanales';
      } else if (!hasTasks && hasPart) {
        toastMsg = 'Notas de PA (Semana 17) auto-calculadas: 100% Participación / Foros';
      }
      showToast(toastMsg, 'success');
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportFullExcel(getCurrentCourse());
    });
  }

  const btnBackBottom = document.getElementById('btn-back-to-step-1-bottom');
  if (btnBack && onBackToStep1) {
    btnBack.addEventListener('click', () => onBackToStep1());
  }
  if (btnBackBottom && onBackToStep1) {
    btnBackBottom.addEventListener('click', () => onBackToStep1());
  }

  if (btnNext && onNavigateToStep3) {
    btnNext.addEventListener('click', () => onNavigateToStep3());
  }
}

function getTargetWeeksForAttendance() {
  const active = AppState.activeGradeWeek;
  if (!isNaN(Number(active))) {
    return [parseInt(active, 10)];
  }

  if (active.startsWith('unit_')) {
    const unitId = active.replace('unit_', '');
    const unit = ACADEMIC_UNITS.find(u => u.id === unitId);
    if (!unit) return [];
    return unit.items.filter(it => it.type === 'regular').map(it => parseInt(it.week, 10));
  }

  if (active === 'consolidado') {
    return REGULAR_WEEKS;
  }

  return [];
}

export function renderUnitAndWeekSelectors() {
  const unitContainer = document.getElementById('unit-selector-group');
  const subweekContainer = document.getElementById('week-subtabs-group');
  if (!unitContainer || !subweekContainer) return;

  unitContainer.innerHTML = '';
  ACADEMIC_UNITS.forEach(unit => {
    const btn = document.createElement('button');
    const isActive = AppState.activeUnitId === unit.id;
    btn.className = isActive
      ? 'unit-tab active px-2.5 py-1 rounded text-xs font-bold bg-[#CC142E] text-white shadow-2xs transition'
      : 'unit-tab px-2.5 py-1 rounded text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition';
    btn.textContent = unit.shortName;
    btn.title = unit.description;

    btn.addEventListener('click', () => {
      AppState.activeUnitId = unit.id;

      if (unit.id === 'consolidado') {
        AppState.activeGradeWeek = 'consolidado';
      } else {
        AppState.activeGradeWeek = unit.items[0]
          ? (unit.items[0].type === 'regular' ? unit.items[0].week : unit.items[0].key)
          : '4';
      }

      renderUnitAndWeekSelectors();
      renderGradesTable();
    });

    unitContainer.appendChild(btn);
  });

  subweekContainer.innerHTML = '';
  const currentUnit = ACADEMIC_UNITS.find(u => u.id === AppState.activeUnitId) || ACADEMIC_UNITS[0];

  if (currentUnit.id === 'consolidado') {
    subweekContainer.innerHTML = `
      <span class="text-xs text-slate-600 font-medium py-1 px-2.5 bg-slate-100 rounded inline-flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px] text-slate-700">table_chart</span>
        <span>Vista Consolidada: Matriz Completa de las 18 Semanas del Semestre</span>
      </span>
    `;
    return;
  }

  const currentCourse = getCurrentCourse();
  const courseHasTasks = currentCourse ? currentCourse.hasTasks !== false : true;
  const courseHasPart = currentCourse ? currentCourse.hasParticipation !== false : true;
  const hasContinuous = courseHasTasks || courseHasPart;

  currentUnit.items.forEach(item => {

    if (item.key === 'pa' && !hasContinuous) {
      return;
    }

    const key = item.type === 'regular' ? item.week : item.key;
    const isSelected = AppState.activeGradeWeek === key;

    const btn = document.createElement('button');
    let baseClass = 'px-2 py-0.5 rounded text-xs transition flex items-center space-x-1 ';

    if (item.type === 'exam') {
      baseClass += isSelected
        ? 'bg-slate-900 text-white font-bold shadow-2xs border border-slate-900'
        : 'bg-white text-slate-800 border border-slate-300 font-semibold hover:bg-slate-100';
    } else {
      baseClass += isSelected
        ? 'bg-white text-[#CC142E] font-bold shadow-2xs border border-slate-200'
        : 'text-slate-600 hover:text-slate-900';
    }

    btn.className = baseClass;
    btn.innerHTML = `
      <span>${item.label}</span>
      ${item.badge ? `<span class="text-[9px] bg-red-100 text-[#CC142E] px-1 py-0.2 rounded font-mono font-bold">${item.badge}</span>` : ''}
    `;

    btn.addEventListener('click', () => {
      AppState.activeGradeWeek = key;
      renderUnitAndWeekSelectors();
      renderGradesTable();
    });

    subweekContainer.appendChild(btn);
  });

  const btnUnitAll = document.createElement('button');
  const isUnitAll = AppState.activeGradeWeek === `unit_${currentUnit.id}`;
  btnUnitAll.className = isUnitAll
    ? 'px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-900 font-bold'
    : 'px-2 py-0.5 rounded text-xs text-slate-500 hover:text-slate-800';
  btnUnitAll.textContent = 'Ver todo';
  btnUnitAll.title = `Ver todas las semanas agrupadas de ${currentUnit.name}`;

  btnUnitAll.addEventListener('click', () => {
    AppState.activeGradeWeek = `unit_${currentUnit.id}`;
    renderUnitAndWeekSelectors();
    renderGradesTable();
  });
  subweekContainer.appendChild(btnUnitAll);
}

export function renderGradesTable() {
  const current = getCurrentCourse();
  if (!current) return;

  const thead = document.getElementById('grades-table-header');
  const tbody = document.getElementById('grades-table-body');
  if (!thead || !tbody) return;

  const total = current.students.length;
  const countEl = document.getElementById('grades-total-count');
  if (countEl) countEl.textContent = total;

  if (total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-slate-400">
          No hay estudiantes registrados. Agrega alumnos en la Nómina (Paso 1).
        </td>
      </tr>
    `;
    renderGradesPagination(0, 1);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (AppState.gradesPage > totalPages) AppState.gradesPage = totalPages;
  if (AppState.gradesPage < 1) AppState.gradesPage = 1;

  const startIdx = (AppState.gradesPage - 1) * PAGE_SIZE;
  const pageStudents = current.students.slice(startIdx, startIdx + PAGE_SIZE);

  const activeKey = AppState.activeGradeWeek;
  const hasTasks = current.hasTasks !== false;
  const hasPart = current.hasParticipation !== false;
  const maxAsist = current.sessionsPerWeek || 1;

  const chkTasks = document.getElementById('chk-eval-tareas');
  if (chkTasks) chkTasks.checked = hasTasks;

  const chkPart = document.getElementById('chk-eval-participacion');
  if (chkPart) chkPart.checked = hasPart;

  const lblTasks = document.getElementById('lbl-eval-tareas');
  const lblPart = document.getElementById('lbl-eval-participacion');
  const btnAutoPaToolbar = document.getElementById('btn-auto-calc-pa-toolbar');

  if (hasTasks && hasPart) {
    if (lblTasks) lblTasks.title = 'Tareas Semanales (Aporta 50% al cálculo continuo de PA en Semana 17. Fórmula: 20% PC1 + 20% PC2 + 20% PC3 + 10% PA + 30% Final)';
    if (lblPart) lblPart.title = 'Participación / Foros (Aporta 50% al cálculo continuo de PA en Semana 17. Fórmula: 20% PC1 + 20% PC2 + 20% PC3 + 10% PA + 30% Final)';
    if (btnAutoPaToolbar) {
      btnAutoPaToolbar.classList.remove('hidden');
      btnAutoPaToolbar.title = 'Auto-calcular notas de PA (Semana 17) para toda la sección: 50% Tareas + 50% Foros';
    }
  } else if (hasTasks && !hasPart) {
    if (lblTasks) lblTasks.title = 'Tareas Semanales (Aporta 100% al cálculo de PA en Semana 17. Fórmula: 20% PC1 + 20% PC2 + 20% PC3 + 10% PA + 30% Final)';
    if (lblPart) lblPart.title = 'Participación / Foros (Desactivado para este curso)';
    if (btnAutoPaToolbar) {
      btnAutoPaToolbar.classList.remove('hidden');
      btnAutoPaToolbar.title = 'Auto-calcular notas de PA (Semana 17) para toda la sección: 100% Tareas Semanales';
    }
  } else if (!hasTasks && hasPart) {
    if (lblTasks) lblTasks.title = 'Tareas Semanales (Desactivado para este curso)';
    if (lblPart) lblPart.title = 'Participación / Foros (Aporta 100% al cálculo de PA en Semana 17. Fórmula: 20% PC1 + 20% PC2 + 20% PC3 + 10% PA + 30% Final)';
    if (btnAutoPaToolbar) {
      btnAutoPaToolbar.classList.remove('hidden');
      btnAutoPaToolbar.title = 'Auto-calcular notas de PA (Semana 17) para toda la sección: 100% Participación / Foros';
    }
  } else {

    if (lblTasks) lblTasks.title = 'Evaluación 100% sumativa. Fórmula: 20% PC1 + 20% PC2 + 20% PC3 + 40% Examen Final';
    if (lblPart) lblPart.title = 'Evaluación 100% sumativa. Fórmula: 20% PC1 + 20% PC2 + 20% PC3 + 40% Examen Final';
    if (btnAutoPaToolbar) {
      btnAutoPaToolbar.classList.add('hidden');
    }
  }

  if (activeKey === 'consolidado') {
    const isSummativeOnly = !hasTasks && !hasPart;
    thead.innerHTML = `
      <tr>
        <th class="px-2.5 py-2.5 w-10 text-center">#</th>
        <th class="px-2.5 py-2.5 w-28">Código</th>
        <th class="px-2.5 py-2.5 min-w-[170px]">Estudiante</th>
        <th class="px-2 py-2 text-center font-mono text-[11px] bg-slate-100/70" title="Asistencia Acumulada">% Asist.</th>
        ${hasTasks ? '<th class="px-2 py-2 text-center font-mono text-[11px] bg-slate-100/70" title="Promedio de Tareas Continuas">Prom. Tar.</th>' : ''}
        ${!hasTasks && hasPart ? '<th class="px-2 py-2 text-center font-mono text-[11px] bg-slate-100/70" title="Promedio de Foros y Participación">Prom. Foros</th>' : ''}
        <th class="px-2 py-2 text-center font-mono text-[11px] bg-red-50 text-[#CC142E] font-bold" title="Práctica Calificada 1 (Semana 5)">PC1 (20%)</th>
        <th class="px-2 py-2 text-center font-mono text-[11px] bg-red-50 text-[#CC142E] font-bold" title="Práctica Calificada 2 (Semana 10)">PC2 (20%)</th>
        <th class="px-2 py-2 text-center font-mono text-[11px] bg-red-50 text-[#CC142E] font-bold" title="Práctica Calificada 3 (Semana 15)">PC3 (20%)</th>
        ${!isSummativeOnly ? '<th class="px-2 py-2 text-center font-mono text-[11px] bg-amber-50 text-amber-700 font-bold" title="Participación en Aula (Semana 17)">PA (10%)</th>' : ''}
        <th class="px-2 py-2 text-center font-mono text-[11px] bg-slate-900 text-white font-bold" title="Examen Final / PC4 (Semana 18)">Final (${isSummativeOnly ? '40%' : '30%'})</th>
      </tr>
    `;

    tbody.innerHTML = '';
    pageStudents.forEach((s, idx) => {
      const globalIdx = startIdx + idx + 1;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/70 border-b border-slate-100 transition-colors text-xs';

      let totalAttended = 0;
      let sumTareas = 0;
      let countTareas = 0;
      let sumForos = 0;
      let countForos = 0;
      REGULAR_WEEKS.forEach(w => {
        if (s[`asist_s${w}`] !== '' && !isNaN(Number(s[`asist_s${w}`]))) {
          totalAttended += Number(s[`asist_s${w}`]);
        }
        if (hasTasks && s[`tarea_s${w}`] !== '' && !isNaN(Number(s[`tarea_s${w}`]))) {
          sumTareas += Number(s[`tarea_s${w}`]);
          countTareas++;
        }
        if (hasPart && s[`foro_s${w}`] !== '' && !isNaN(Number(s[`foro_s${w}`]))) {
          sumForos += Number(s[`foro_s${w}`]);
          countForos++;
        }
      });
      const maxTotalSessions = REGULAR_WEEKS.length * maxAsist;
      const asistPct = maxTotalSessions > 0 ? Math.round((totalAttended / maxTotalSessions) * 100) : 100;
      const avgTareas = countTareas > 0 ? (sumTareas / countTareas).toFixed(2) : '—';
      const avgForos = countForos > 0 ? (sumForos / countForos).toFixed(2) : '—';

      tr.innerHTML = `
        <td class="px-2 py-2 text-center font-mono text-[11px] text-slate-400">${globalIdx}</td>
        <td class="px-2 py-2 font-mono text-xs text-slate-700">${s.codigo || '—'}</td>
        <td class="px-2 py-2 font-medium text-xs text-slate-900">${s.nombre || 'Sin nombre'}</td>
        <td class="px-2 py-1.5 text-center font-mono ${asistPct < 70 ? 'text-[#CC142E] font-bold' : 'text-slate-700'}">${asistPct}%</td>
        ${hasTasks ? `<td class="px-2 py-1.5 text-center font-mono">${avgTareas}</td>` : ''}
        ${!hasTasks && hasPart ? `<td class="px-2 py-1.5 text-center font-mono">${avgForos}</td>` : ''}
        <td class="px-1.5 py-1.5 text-center bg-red-50/30">
          <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="pc1" value="${s.pc1 ?? ''}" placeholder="0" class="grade-input font-mono text-xs w-12 px-1 py-1 text-center bg-white border border-slate-200 rounded focus:border-[#CC142E] focus:outline-none">
        </td>
        <td class="px-1.5 py-1.5 text-center bg-red-50/30">
          <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="pc2" value="${s.pc2 ?? ''}" placeholder="0" class="grade-input font-mono text-xs w-12 px-1 py-1 text-center bg-white border border-slate-200 rounded focus:border-[#CC142E] focus:outline-none">
        </td>
        <td class="px-1.5 py-1.5 text-center bg-red-50/30">
          <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="pc3" value="${s.pc3 ?? ''}" placeholder="0" class="grade-input font-mono text-xs w-12 px-1 py-1 text-center bg-white border border-slate-200 rounded focus:border-[#CC142E] focus:outline-none">
        </td>
        ${!isSummativeOnly ? `
          <td class="px-1.5 py-1.5 text-center bg-amber-50/30">
            <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="pa" value="${s.pa ?? ''}" placeholder="0" class="grade-input font-mono text-xs w-12 px-1 py-1 text-center bg-white border border-slate-200 rounded focus:border-amber-500 focus:outline-none">
          </td>
        ` : ''}
        <td class="px-1.5 py-1.5 text-center bg-slate-100/50">
          <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="pc4" value="${s.pc4 ?? ''}" placeholder="0" class="grade-input font-mono text-xs w-12 px-1 py-1 text-center bg-white border border-slate-300 font-bold rounded focus:border-slate-800 focus:outline-none">
        </td>
      `;

      tbody.appendChild(tr);
    });

    renderGradesPagination(total, totalPages);
    attachGradeInputListeners();
    return;
  }

  const examMatch = EVALUATION_MILESTONES.find(e => e.key === activeKey);
  if (examMatch) {
    const isPa = activeKey === 'pa';
    let autoCalcTitle = 'Auto-calcular PA según actividades continuas';
    if (hasTasks && hasPart) autoCalcTitle = 'Auto-calcular PA: 50% Tareas + 50% Foros';
    else if (hasTasks && !hasPart) autoCalcTitle = 'Auto-calcular PA: 100% Tareas Semanales';
    else if (!hasTasks && hasPart) autoCalcTitle = 'Auto-calcular PA: 100% Participación / Foros';

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5 w-12 text-center">#</th>
        <th class="px-3 py-2.5 w-36">Código UTP</th>
        <th class="px-3 py-2.5 min-w-[200px]">Estudiante</th>
        <th class="px-3 py-2.5 w-72 text-center ${isPa ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-red-50 text-[#CC142E]'} font-bold">
          <div class="flex items-center justify-center gap-2">
            <span>Calificación ${examMatch.fullLabel} (0 - 20)</span>
            ${isPa ? `
              <button id="btn-auto-calc-pa" class="px-2 py-0.5 text-[10px] font-bold bg-[#CC142E] hover:bg-[#B50D30] text-white rounded transition shadow-2xs inline-flex items-center gap-1 cursor-pointer" title="${autoCalcTitle}">
                <span class="material-symbols-outlined text-[13px]">auto_fix_high</span>
                <span>Auto-calcular</span>
              </button>
            ` : ''}
          </div>
        </th>
      </tr>
    `;

    tbody.innerHTML = '';
    pageStudents.forEach((s, idx) => {
      const globalIdx = startIdx + idx + 1;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/70 border-b border-slate-100 transition-colors text-xs';

      const sugPa = isPa ? calculateSuggestedPa(s, hasPart, hasTasks) : null;
      let sugTitle = '';
      if (hasTasks && hasPart) sugTitle = 'Cálculo continuo sugerido: 50% Tareas + 50% Foros';
      else if (hasTasks && !hasPart) sugTitle = 'Cálculo continuo sugerido: 100% Tareas Semanales';
      else if (!hasTasks && hasPart) sugTitle = 'Cálculo continuo sugerido: 100% Participación / Foros';

      tr.innerHTML = `
        <td class="px-3 py-2 text-center font-mono text-xs text-slate-400">${globalIdx}</td>
        <td class="px-3 py-2 font-mono text-xs text-slate-700">${s.codigo || '—'}</td>
        <td class="px-3 py-2 font-medium text-xs text-slate-900">${s.nombre || 'Sin nombre'}</td>
        <td class="px-3 py-1.5 text-center ${isPa ? 'bg-amber-50/20' : 'bg-red-50/20'}">
          <div class="inline-flex items-center justify-center gap-2">
            <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="${examMatch.key}" value="${s[examMatch.key] !== undefined ? s[examMatch.key] : ''}" placeholder="0.0" class="grade-input font-mono text-xs font-bold text-center w-24 px-2 py-1.5 bg-white border border-slate-300 rounded focus:border-[#CC142E] focus:outline-none">
            ${isPa ? `<span class="text-[10px] text-slate-500 font-mono" title="${sugTitle}">(Sugerido: ${sugPa.toFixed(1)})</span>` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (isPa) {
      const btnAutoPa = document.getElementById('btn-auto-calc-pa');
      if (btnAutoPa) {
        btnAutoPa.addEventListener('click', () => {
          current.students.forEach(st => {
            st.pa = calculateSuggestedPa(st, hasPart, hasTasks);
          });
          saveStateToStorage();
          renderGradesTable();
          let toastMsg = '';
          if (hasTasks && hasPart) {
            toastMsg = 'Notas de PA (Semana 17) auto-calculadas: 50% Tareas + 50% Foros';
          } else if (hasTasks && !hasPart) {
            toastMsg = 'Notas de PA (Semana 17) auto-calculadas: 100% Tareas Semanales';
          } else if (!hasTasks && hasPart) {
            toastMsg = 'Notas de PA (Semana 17) auto-calculadas: 100% Participación / Foros';
          }
          showToast(toastMsg, 'success');
        });
      }
    }

    renderGradesPagination(total, totalPages);
    attachGradeInputListeners();
    return;
  }

  const w = activeKey;
  thead.innerHTML = `
    <tr>
      <th class="px-3 py-2.5 w-12 text-center">#</th>
      <th class="px-3 py-2.5 w-36">Código UTP</th>
      <th class="px-3 py-2.5 min-w-[220px]">Estudiante</th>
      <th class="px-3 py-2.5 w-32 text-center">Asist. S${w} (Tope 0-${maxAsist})</th>
      ${hasTasks ? `<th class="px-3 py-2.5 w-32 text-center">Tarea S${w} (0-20)</th>` : ''}
      ${hasPart ? `<th class="px-3 py-2.5 w-32 text-center">Foro S${w} (0-20)</th>` : ''}
    </tr>
  `;

  tbody.innerHTML = '';
  pageStudents.forEach((s, idx) => {
    const globalIdx = startIdx + idx + 1;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/70 border-b border-slate-100 transition-colors text-xs';

    tr.innerHTML = `
      <td class="px-3 py-2 text-center font-mono text-xs text-slate-400">${globalIdx}</td>
      <td class="px-3 py-2 font-mono text-xs text-slate-700">${s.codigo || '—'}</td>
      <td class="px-3 py-2 font-medium text-xs text-slate-900">${s.nombre || 'Sin nombre'}</td>
      <td class="px-3 py-1.5 text-center">
        <input type="number" min="0" max="${maxAsist}" data-id="${s.id}" data-field="asist_s${w}" value="${s['asist_s' + w] !== undefined ? s['asist_s' + w] : ''}" placeholder="0" class="grade-input font-mono text-xs w-20 px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400">
      </td>
      ${hasTasks ? `
        <td class="px-3 py-1.5 text-center">
          <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="tarea_s${w}" value="${s['tarea_s' + w] !== undefined ? s['tarea_s' + w] : ''}" placeholder="0.0" class="grade-input font-mono text-xs w-20 px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400">
        </td>
      ` : ''}
      ${hasPart ? `
        <td class="px-3 py-1.5 text-center">
          <input type="number" min="0" max="20" step="0.5" data-id="${s.id}" data-field="foro_s${w}" value="${s['foro_s' + w] !== undefined ? s['foro_s' + w] : ''}" placeholder="0.0" class="grade-input font-mono text-xs w-20 px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400">
        </td>
      ` : ''}
    `;

    tbody.appendChild(tr);
  });

  renderGradesPagination(total, totalPages);
  attachGradeInputListeners();
}

function renderGradesPagination(total, totalPages) {
  let paginationContainer = document.getElementById('grades-pagination-container');
  if (!paginationContainer) {
    const footer = document.querySelector('#view-grades .bg-slate-50.border-t');
    if (footer) {
      paginationContainer = document.createElement('div');
      paginationContainer.id = 'grades-pagination-container';
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

  const currentPage = AppState.gradesPage;

  const btnPrev = document.createElement('button');
  btnPrev.className = `px-2 py-0.5 rounded text-xs border font-medium inline-flex items-center gap-1 ${currentPage === 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`;
  btnPrev.innerHTML = '<span class="material-symbols-outlined text-xs leading-none">chevron_left</span> Anterior';
  btnPrev.disabled = currentPage === 1;
  btnPrev.addEventListener('click', () => {
    if (AppState.gradesPage > 1) {
      AppState.gradesPage--;
      renderGradesTable();
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
    if (AppState.gradesPage < totalPages) {
      AppState.gradesPage++;
      renderGradesTable();
    }
  });
  paginationContainer.appendChild(btnNext);
}

function attachGradeInputListeners() {
  const current = getCurrentCourse();
  if (!current) return;

  const maxAsist = current.sessionsPerWeek || 1;

  const inputs = document.querySelectorAll('.grade-input');
  inputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const field = e.target.dataset.field;
      let val = e.target.value;

      if (val !== '' && !isNaN(Number(val))) {
        val = Number(val);

        if (field.startsWith('asist_')) {
          val = Math.min(maxAsist, Math.max(0, Math.round(val)));
          e.target.value = val;
        }

        if (field.startsWith('tarea_') || field.startsWith('foro_') || ['pc1','pc2','pc3','pa','pc4'].includes(field)) {
          val = Math.min(20, Math.max(0, val));
          e.target.value = val;
        }
      } else {
        val = '';
      }

      const student = current.students.find(s => s.id === id);
      if (student) {
        student[field] = val;
        saveStateToStorage();
      }
    });
  });
}
