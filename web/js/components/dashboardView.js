import { AppState, getCurrentCourse } from '../state.js';
import { computeCourseAnalytics, calculateCourseKpis, calculateParetoData, calculateHistogramData } from '../services/analytics.js';
import { exportDiagnosticsExcel } from '../services/excelService.js';
import { PAGE_SIZE } from '../constants.js';

export function setupStep3Dashboard(callbacks = {}) {
  const { onBackToStep2 } = callbacks;

  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white');
        b.classList.add('bg-white');
      });
      btn.classList.add('bg-slate-900', 'text-white');
      btn.classList.remove('bg-white');

      AppState.activeFilter = btn.dataset.filter;
      AppState.dashboardPage = 1;
      renderDashboardTable();
    });
  });

  const searchInput = document.getElementById('dashboard-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      AppState.dashboardPage = 1;
      renderDashboardTable();
    });
  }

  const selectCutoff = document.getElementById('select-cutoff-week');
  if (selectCutoff) {
    selectCutoff.addEventListener('change', (e) => {
      AppState.analysisCutoffWeek = parseInt(e.target.value, 10);
      AppState.dashboardPage = 1;
      renderDashboard();
    });
  }

  const btnExportDiag = document.getElementById('btn-export-diagnostics-excel');
  if (btnExportDiag) {
    btnExportDiag.addEventListener('click', () => {
      exportDiagnosticsExcel(getCurrentCourse());
    });
  }

  const btnBack = document.getElementById('btn-back-to-step-2');
  if (btnBack && onBackToStep2) {
    btnBack.addEventListener('click', () => onBackToStep2());
  }

  setupAnalyticsCarousel();

  setupTableTooltips();
}

export function renderDashboard() {
  const current = getCurrentCourse();
  if (!current) return;

  const cutoff = AppState.analysisCutoffWeek || 4;

  computeCourseAnalytics(current, cutoff);

  renderPhaseBanner(current, cutoff);
  renderKPIs(current);
  renderCharts(current);
  renderDashboardTable();
}

function renderPhaseBanner(current, cutoff) {
  const phaseTag = document.getElementById('phase-tag');
  const phaseDesc = document.getElementById('phase-description');
  const phaseAction = document.getElementById('phase-action-summary');

  if (phaseTag) phaseTag.textContent = `Corte de análisis: Semana ${cutoff}`;

  let desc = '';
  let action = '';

  if (cutoff <= 5) {
    desc = `Semana 1 a 4: Detección a tiempo — Curso: ${current.name} (Sección ${current.section})`;
    action = 'Identifica qué alumnos tienen dificultades antes de la primera práctica calificada (PC1).';
  } else if (cutoff <= 10) {
    desc = `Semana 6 a 9: Mitad del curso — Curso: ${current.name} (Sección ${current.section})`;
    action = 'Revisa quiénes salieron bajos en la PC1 y ayúdalos a recuperarse antes de la PC2.';
  } else if (cutoff <= 15) {
    desc = `Semana 11 a 14: Recta final — Curso: ${current.name} (Sección ${current.section})`;
    action = 'Atención urgente a estudiantes que acumulan muchas faltas o tienen notas en riesgo.';
  } else {
    desc = `Semana 16 a 18: Cierre del curso — Curso: ${current.name} (Sección ${current.section})`;
    action = 'Revisa los promedios finales y brinda apoyo a quienes están al borde de aprobar.';
  }

  if (phaseDesc) phaseDesc.textContent = desc;
  if (phaseAction) phaseAction.textContent = action;
}

function renderKPIs(current) {
  const results = current.analyticsResults || [];
  const total = results.length;
  const isFinalClosure = (AppState.analysisCutoffWeek || 4) >= 18;

  const elTotal = document.getElementById('kpi-total-students');
  const elLabelTotal = document.getElementById('kpi-label-total');
  const elSubTotal = document.getElementById('kpi-sub-total');

  const elAvgAsist = document.getElementById('kpi-avg-attendance');
  const elLabelCol2 = document.getElementById('kpi-label-col2');
  const elSubCol2 = document.getElementById('kpi-sub-col2');

  const elReds = document.getElementById('kpi-red-alerts');
  const elLabelCol3 = document.getElementById('kpi-label-col3');
  const elSubCol3 = document.getElementById('kpi-sub-col3');

  const elDpi = document.getElementById('kpi-dpi-risk');
  const elLabelCol4 = document.getElementById('kpi-label-col4');
  const elSubCol4 = document.getElementById('kpi-sub-col4');

  if (elTotal) elTotal.textContent = total;

  if (total === 0) {
    if (elAvgAsist) elAvgAsist.textContent = '0%';
    if (elReds) elReds.textContent = '0';
    if (elDpi) elDpi.textContent = '0';
    return;
  }

  const kpis = calculateCourseKpis(results);
  const avgAttendance = results.reduce((acc, s) => acc + s.asistPct, 0) / total;

  if (isFinalClosure) {

    if (elLabelCol2) elLabelCol2.textContent = 'Aprobados Oficiales';
    if (elAvgAsist) elAvgAsist.textContent = `${kpis.aprobadosCount} (${kpis.aprobadosPct}%)`;
    if (elSubCol2) elSubCol2.textContent = `Promedio general: ${kpis.promedioFinal}`;

    if (elLabelCol3) elLabelCol3.textContent = 'Repiten Asignatura';
    if (elReds) elReds.textContent = kpis.criticos;
    if (elSubCol3) elSubCol3.textContent = `Promedio < 08 o DPI`;

    if (elLabelCol4) elLabelCol4.textContent = 'Aptos a Subsanación';
    if (elDpi) elDpi.textContent = kpis.monitoreo;
    if (elSubCol4) elSubCol4.textContent = `Promedio entre 08 y 11.9`;
  } else {

    if (elLabelCol2) elLabelCol2.textContent = 'Asistencia del Salón';
    if (elAvgAsist) elAvgAsist.textContent = `${Math.round(avgAttendance * 100)}%`;
    if (elSubCol2) elSubCol2.textContent = 'Promedio acumulado';

    if (elLabelCol3) elLabelCol3.textContent = 'En Peligro (Rojo)';
    if (elReds) elReds.textContent = kpis.criticos;
    if (elSubCol3) elSubCol3.textContent = 'Riesgo alto de jalar';

    if (elLabelCol4) elLabelCol4.textContent = 'Por Límite de Faltas (DPI)';
    if (elDpi) elDpi.textContent = kpis.dpiCount;
    if (elSubCol4) elSubCol4.textContent = '30% o más de inasistencias';
  }
}

export function getAvailableSlideIndices(course) {
  if (!course) return [0, 1, 2, 3];
  const hasTasks = course.hasTasks !== false;
  const hasPart = course.hasParticipation !== false;
  const cutoff = AppState.analysisCutoffWeek || 4;
  const isFinalClosure = cutoff >= 18;
  const results = course.analyticsResults || [];
  const hasExamsData = results.some(s => s.examsAvg !== null && s.examsAvg !== '—' && !isNaN(Number(s.examsAvg)));

  const showGradeCharts = hasTasks || hasPart || hasExamsData || isFinalClosure;
  if (!showGradeCharts) {
    return [0, 2];
  }
  return [0, 1, 2, 3];
}

export function updateCarouselTabs(current) {
  const availableIndices = getAvailableSlideIndices(current);
  const hasTasks = current ? current.hasTasks !== false : true;
  const hasPart = current ? current.hasParticipation !== false : true;

  const tab0 = document.getElementById('tab-carousel-0');
  const tab1 = document.getElementById('tab-carousel-1');
  const tab2 = document.getElementById('tab-carousel-2');
  const tab3 = document.getElementById('tab-carousel-3');

  const label0 = document.getElementById('tab-label-0');
  const label1 = document.getElementById('tab-label-1');
  const label2 = document.getElementById('tab-label-2');
  const label3 = document.getElementById('tab-label-3');

  if (availableIndices.length === 2) {

    if (tab1) tab1.classList.add('hidden');
    if (tab3) tab3.classList.add('hidden');
    if (tab0) tab0.classList.remove('hidden');
    if (tab2) tab2.classList.remove('hidden');

    if (label0) label0.textContent = '1. Semáforo del Salón';
    if (label2) label2.textContent = '2. Problema Principal';
  } else {

    if (tab0) tab0.classList.remove('hidden');
    if (tab1) tab1.classList.remove('hidden');
    if (tab2) tab2.classList.remove('hidden');
    if (tab3) tab3.classList.remove('hidden');

    let scatterLabel = '2. Asistencia vs Tareas';
    let histLabel = '4. Notas (0 a 20)';
    if (hasTasks) {
      scatterLabel = '2. Asistencia vs Tareas';
      histLabel = '4. Notas (0 a 20)';
    } else if (hasPart) {
      scatterLabel = '2. Asistencia vs Foros';
      histLabel = '4. Notas de Foros (0 a 20)';
    } else {
      scatterLabel = '2. Asistencia vs Exámenes';
      histLabel = '4. Notas de Exámenes';
    }

    if (label0) label0.textContent = '1. Semáforo del Salón';
    if (label1) label1.textContent = scatterLabel;
    if (label2) label2.textContent = '3. Problema Principal';
    if (label3) label3.textContent = histLabel;
  }
}

function renderCharts(current) {
  const results = current.analyticsResults || [];
  const total = results.length;
  const isFinalClosure = (AppState.analysisCutoffWeek || 4) >= 18;
  const hasTasks = current.hasTasks !== false;
  const hasPart = current.hasParticipation !== false;
  const availableIndices = getAvailableSlideIndices(current);

  updateCarouselTabs(current);

  if (total === 0) {
    updateCarouselGuide(0, current);
    return;
  }

  const greens = results.filter(s => s.semaforo === 'green').length;
  const yellows = results.filter(s => s.semaforo === 'yellow').length;
  const reds = results.filter(s => s.semaforo === 'red').length;

  const elG = document.getElementById('donut-green-pct');
  const elY = document.getElementById('donut-yellow-pct');
  const elR = document.getElementById('donut-red-pct');

  if (elG) elG.textContent = `${Math.round((greens / total) * 100)}%`;
  if (elY) elY.textContent = `${Math.round((yellows / total) * 100)}%`;
  if (elR) elR.textContent = `${Math.round((reds / total) * 100)}%`;

  if (AppState.charts.donut) AppState.charts.donut.destroy();
  if (AppState.charts.scatter) AppState.charts.scatter.destroy();
  if (AppState.charts.pareto) AppState.charts.pareto.destroy();
  if (AppState.charts.histogram) AppState.charts.histogram.destroy();

  const canvasDonut = document.getElementById('chart-risk-donut');
  if (canvasDonut && window.Chart) {
    const ctxDonut = canvasDonut.getContext('2d');
    const donutLabels = isFinalClosure
      ? ['Aprobados', 'Aptos Subsanación', 'Repiten / DPI']
      : ['Bajo Riesgo', 'Moderado', 'Crítico'];

    AppState.charts.donut = new window.Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: donutLabels,
        datasets: [{
          data: [greens, yellows, reds],
          backgroundColor: ['#00A88E', '#F59E0B', '#CC142E'],
          borderWidth: 2,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '72%'
      }
    });
  }

  const canvasScatter = document.getElementById('chart-scatter-attendance');
  if (canvasScatter && window.Chart && availableIndices.includes(1)) {
    const ctxScatter = canvasScatter.getContext('2d');
    const scatterPoints = results.map(s => {
      let gradeY = 0;
      if (isFinalClosure) {
        gradeY = Number(s.promedioFinal.toFixed(2));
      } else if (hasTasks) {
        gradeY = Number(s.tareasAvg.toFixed(2));
      } else if (hasPart) {
        gradeY = Number(s.partAvg.toFixed(2));
      } else if (s.examsAvg !== null && s.examsAvg !== '—') {
        gradeY = Number(Number(s.examsAvg).toFixed(2));
      }
      return {
        x: Math.round(s.asistPct * 100),
        y: gradeY,
        student: s.nombre,
        semaforo: s.semaforo,
      };
    });

    const greenLabel = isFinalClosure ? 'Aprobados' : 'Verde (Autonomía)';
    const yellowLabel = isFinalClosure ? 'Subsanación' : 'Amarillo (Monitoreo)';
    const redLabel = isFinalClosure ? 'Repiten / DPI' : 'Rojo (Crítico)';

    let yAxisLabel = 'Tareas (0-20)';
    if (isFinalClosure) yAxisLabel = 'Promedio Final (0-20)';
    else if (hasTasks) yAxisLabel = 'Tareas (0-20)';
    else if (hasPart) yAxisLabel = 'Foros / Participación (0-20)';
    else yAxisLabel = 'Exámenes (0-20)';

    const scatterHeaderTitle = document.getElementById('scatter-header-title');
    const scatterSubFooter = document.getElementById('scatter-sub-footer');
    if (scatterHeaderTitle) {
      if (isFinalClosure) {
        scatterHeaderTitle.textContent = '¿Quiénes asisten y quiénes aprueban?';
      } else if (hasTasks) {
        scatterHeaderTitle.textContent = '¿Quiénes asisten y quiénes aprueban tareas?';
      } else if (hasPart) {
        scatterHeaderTitle.textContent = '¿Quiénes asisten y quiénes participan en foros?';
      } else {
        scatterHeaderTitle.textContent = '¿Quiénes asisten y cómo rinden en exámenes?';
      }
    }
    if (scatterSubFooter) {
      scatterSubFooter.textContent = `Eje horizontal: % de Asistencia · Eje vertical: ${yAxisLabel}`;
    }

    AppState.charts.scatter = new window.Chart(ctxScatter, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: greenLabel,
            data: scatterPoints.filter(p => p.semaforo === 'green'),
            backgroundColor: '#00A88E',
            pointRadius: 5
          },
          {
            label: yellowLabel,
            data: scatterPoints.filter(p => p.semaforo === 'yellow'),
            backgroundColor: '#F59E0B',
            pointRadius: 5
          },
          {
            label: redLabel,
            data: scatterPoints.filter(p => p.semaforo === 'red'),
            backgroundColor: '#CC142E',
            pointRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Asistencia (%)', font: { size: 10, weight: 'bold' } },
            min: 0,
            max: 105,
            grid: { color: '#F1F5F9' }
          },
          y: {
            title: { display: true, text: yAxisLabel, font: { size: 10, weight: 'bold' } },
            min: 0,
            max: 20,
            grid: { color: '#F1F5F9' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => isFinalClosure
                ? `${ctx.raw.student}: ${ctx.raw.x}% asist | Promedio Final: ${ctx.raw.y}`
                : `${ctx.raw.student}: ${ctx.raw.x}% asist | Nota: ${ctx.raw.y}`
            }
          },
          legend: { position: 'top', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } }
        }
      }
    });
  }

  const canvasPareto = document.getElementById('chart-pareto-risk');
  if (canvasPareto && window.Chart) {
    const paretoData = calculateParetoData(results);
    const ctxPareto = canvasPareto.getContext('2d');

    AppState.charts.pareto = new window.Chart(ctxPareto, {
      data: {
        labels: paretoData.labels,
        datasets: [
          {
            type: 'line',
            label: '% Acumulado (Pareto)',
            data: paretoData.cumulativePercentages,
            borderColor: '#000F37',
            backgroundColor: '#000F37',
            borderWidth: 2.5,
            pointBackgroundColor: '#CC142E',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            yAxisID: 'y1',
            tension: 0.2,
            order: 1,
          },
          {
            type: 'bar',
            label: isFinalClosure ? 'Alumnos Afectados' : 'Casos Detectados',
            data: paretoData.counts,
            backgroundColor: '#CC142E',
            borderRadius: 4,
            yAxisID: 'y',
            order: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.type === 'line') {
                  return ` ${ctx.dataset.label}: ${ctx.raw}%`;
                }
                return ` ${ctx.dataset.label}: ${ctx.raw} estudiante(s)`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 9 }, maxRotation: 20, minRotation: 0 },
            grid: { display: false }
          },
          y: {
            title: { display: true, text: 'N° Casos', font: { size: 10, weight: 'bold' } },
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 10 } },
            grid: { color: '#F1F5F9' }
          },
          y1: {
            title: { display: true, text: '% Acumulado', font: { size: 10, weight: 'bold' } },
            position: 'right',
            min: 0,
            max: 100,
            ticks: {
              callback: (val) => `${val}%`,
              font: { size: 9 },
              stepSize: 20
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  const canvasHist = document.getElementById('chart-grade-histogram');
  if (canvasHist && window.Chart && availableIndices.includes(3)) {
    const histData = calculateHistogramData(results, hasTasks);
    const ctxHist = canvasHist.getContext('2d');

    const histHeaderTitle = document.getElementById('hist-header-title');
    const histSubFooter = document.getElementById('hist-sub-footer');
    if (histHeaderTitle) {
      if (isFinalClosure) {
        histHeaderTitle.textContent = '¿Cómo van las notas de tu salón? (0 a 20)';
      } else if (hasTasks) {
        histHeaderTitle.textContent = '¿Cómo van las notas de tareas de tu salón? (0 a 20)';
      } else if (hasPart) {
        histHeaderTitle.textContent = '¿Cómo van las notas de foros de tu salón? (0 a 20)';
      } else {
        histHeaderTitle.textContent = '¿Cómo van las notas de exámenes? (0 a 20)';
      }
    }
    if (histSubFooter) {
      if (isFinalClosure) {
        histSubFooter.textContent = 'Menos de 12.0: Repiten o Subsanación · 12.0 a 20.0: Aprobados';
      } else if (hasTasks) {
        histSubFooter.textContent = 'Menos de 12.0: Tareas insuficientes · 12.0 a 20.0: Tareas aprobadas';
      } else if (hasPart) {
        histSubFooter.textContent = 'Menos de 12.0: Participación insuficiente · 12.0 a 20.0: Participación aprobada';
      } else {
        histSubFooter.textContent = 'Menos de 12.0: Insuficiente en exámenes · 12.0 a 20.0: Aprobados en examen';
      }
    }

    const badgeDis = document.getElementById('badge-disapproved-count');
    const badgeApp = document.getElementById('badge-approved-count');
    if (badgeDis) badgeDis.textContent = `Desaprobados (< 12): ${histData.disapprovedCount}`;
    if (badgeApp) badgeApp.textContent = `Aprobados (≥ 12): ${histData.approvedCount}`;

    AppState.charts.histogram = new window.Chart(ctxHist, {
      type: 'bar',
      data: {
        labels: histData.labels,
        datasets: [{
          label: 'Cantidad de Estudiantes',
          data: histData.counts,
          backgroundColor: [
            '#991B1B',
            '#DC2626',
            '#F59E0B',
            '#00A88E',
            '#047857',
          ],
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw} estudiante(s) en este rango`
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 9 }, maxRotation: 20, minRotation: 0 },
            grid: { display: false }
          },
          y: {
            title: { display: true, text: 'N° Estudiantes', font: { size: 10, weight: 'bold' } },
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 10 } },
            grid: { color: '#F1F5F9' }
          }
        }
      }
    });
  }

  let activeSlide = AppState.activeChartSlide ?? 0;
  if (!availableIndices.includes(activeSlide)) {
    activeSlide = availableIndices[0];
  }
  switchAnalyticsSlide(activeSlide);
}

export function renderDashboardTable() {
  const current = getCurrentCourse();
  if (!current) return;

  const isFinalClosure = (AppState.analysisCutoffWeek || 4) >= 18;
  const tbody = document.getElementById('dashboard-table-body');
  const searchInput = document.getElementById('dashboard-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filter = AppState.activeFilter;
  const hasTasks = current.hasTasks !== false;
  const hasPart = current.hasParticipation !== false;
  const results = current.analyticsResults || [];

  const tableTitle = document.getElementById('dashboard-table-title');
  const tableSubtitle = document.getElementById('dashboard-table-subtitle');

  if (isFinalClosure) {
    if (tableTitle) tableTitle.textContent = 'Cierre de semestre: Promedio final, causa del resultado y trámite académico';
    if (tableSubtitle) tableSubtitle.textContent = 'Pasa el ratón sobre los códigos para ver por qué obtuvo ese resultado y su situación académica';
  } else {
    if (tableTitle) tableTitle.textContent = 'Diagnóstico individual: ¿Qué le pasa a cada alumno y qué hacer?';
    if (tableSubtitle) tableSubtitle.textContent = 'Pasa el ratón sobre los códigos para ver la recomendación para cada estudiante';
  }

  const thead = document.getElementById('dashboard-table-head');
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th class="px-3.5 py-2.5">Código</th>
        <th class="px-3.5 py-2.5">Estudiante</th>
        <th class="px-3.5 py-2.5 text-center">Asistencia</th>
        ${hasTasks ? '<th class="px-3.5 py-2.5 text-center">Tareas</th>' : ''}
        ${hasPart ? '<th class="px-3.5 py-2.5 text-center">Foros</th>' : ''}
        <th class="px-3.5 py-2.5 text-center">Exámenes</th>
        <th class="px-3.5 py-2.5 text-center" id="th-col-risk">${isFinalClosure ? 'Promedio Final' : 'Riesgo'}</th>
        <th class="px-3.5 py-2.5 text-center" id="th-col-status">${isFinalClosure ? 'Condición' : 'Estado'}</th>
        <th class="px-3.5 py-2.5 text-center whitespace-nowrap" id="th-col-cause" title="Causa del resultado detectado">${isFinalClosure ? 'Causa del Resultado' : '¿Qué le pasa?'}</th>
        <th class="px-3.5 py-2.5 text-center whitespace-nowrap" id="th-col-action" title="Acción recomendada para el docente">${isFinalClosure ? 'Situación Académica' : '¿Qué hacer?'}</th>
      </tr>
    `;
  }

  const lblRed = document.getElementById('label-filter-red');
  const lblYellow = document.getElementById('label-filter-yellow');
  const lblGreen = document.getElementById('label-filter-green');

  if (isFinalClosure) {
    if (lblRed) lblRed.textContent = 'Repiten';
    if (lblYellow) lblYellow.textContent = 'Subsanación';
    if (lblGreen) lblGreen.textContent = 'Aprobados';
  } else {
    if (lblRed) lblRed.textContent = 'Peligro';
    if (lblYellow) lblYellow.textContent = 'Atención';
    if (lblGreen) lblGreen.textContent = 'Al Día';
  }

  const countAll = document.getElementById('count-filter-all');
  const countRed = document.getElementById('count-filter-red');
  const countDpi = document.getElementById('count-filter-dpi');
  const countYellow = document.getElementById('count-filter-yellow');
  const countGreen = document.getElementById('count-filter-green');

  if (countAll) countAll.textContent = results.length;
  if (countRed) countRed.textContent = results.filter(s => s.semaforo === 'red').length;
  if (countDpi) countDpi.textContent = results.filter(s => s.isDpiCritical).length;
  if (countYellow) countYellow.textContent = results.filter(s => s.semaforo === 'yellow').length;
  if (countGreen) countGreen.textContent = results.filter(s => s.semaforo === 'green').length;

  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = results.filter(s => {
    const matchText = s.nombre.toLowerCase().includes(query) || s.codigo.toLowerCase().includes(query);
    if (!matchText) return false;

    if (filter === 'all') return true;
    if (filter === 'red') return s.semaforo === 'red';
    if (filter === 'yellow') return s.semaforo === 'yellow';
    if (filter === 'green') return s.semaforo === 'green';
    if (filter === 'dpi') return s.isDpiCritical;
    return true;
  });

  const totalFiltered = filtered.length;

  if (totalFiltered === 0) {
    const totalCols = 3 + (hasTasks ? 1 : 0) + (hasPart ? 1 : 0) + 5;
    tbody.innerHTML = `
      <tr>
        <td colspan="${totalCols}" class="px-4 py-8 text-center text-slate-400">
          No se encontraron estudiantes con los criterios seleccionados en esta sección.
        </td>
      </tr>
    `;
    renderDashboardPagination(0, 1);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  if (AppState.dashboardPage > totalPages) AppState.dashboardPage = totalPages;
  if (AppState.dashboardPage < 1) AppState.dashboardPage = 1;

  const startIdx = (AppState.dashboardPage - 1) * PAGE_SIZE;
  const pageStudents = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  pageStudents.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/70 border-b border-slate-100 transition-colors';

    let semaforoBadge = '';
    let colRiskHtml = '';
    let causaColorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let accionColorClass = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400';

    if (isFinalClosure) {

      if (s.condicionFinal === 'DPI') {
        semaforoBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">DPI</span>';
      } else if (s.condicionFinal === 'APROBADO') {
        semaforoBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#00A88E] border border-emerald-200">Aprobado</span>';
      } else {
        semaforoBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#CC142E] border border-red-200">Desaprobado</span>';
      }

      const pfClass = s.promedioFinal >= 12 ? 'text-[#00A88E]' : s.promedioFinal >= 8 ? 'text-amber-700' : 'text-[#CC142E]';
      colRiskHtml = `
        <span class="font-mono text-xs font-bold ${pfClass}">${s.promedioFinalLabel}</span>
      `;

      if (s.causaCodigo === 'C-DEST') causaColorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      else if (s.causaCodigo === 'C-APROB') causaColorClass = 'bg-emerald-50 text-[#00A88E] border-emerald-200';
      else if (s.causaCodigo === 'C-DPI') causaColorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      else if (s.causaCodigo === 'C-FINAL') causaColorClass = 'bg-red-50 text-[#CC142E] border-red-200';
      else if (s.causaCodigo === 'C-TAREAS') causaColorClass = 'bg-orange-50 text-orange-800 border-orange-200';
      else if (s.causaCodigo === 'C-NOTAS') causaColorClass = 'bg-rose-50 text-rose-700 border-rose-200';

      if (s.accionCodigo === 'S-PROMOVIDO') accionColorClass = 'border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100';
      else if (s.accionCodigo === 'S-SUBSANAR') accionColorClass = 'border-amber-300 bg-amber-50/60 text-amber-800 hover:bg-amber-100';
      else if (s.accionCodigo === 'S-REPETIR') accionColorClass = 'border-red-300 bg-red-50/60 text-[#CC142E] hover:bg-red-100';

    } else {

      if (s.semaforo === 'red') {
        semaforoBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-[#CC142E] border border-red-200">Crítico</span>';
      } else if (s.semaforo === 'yellow') {
        semaforoBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Monitoreo</span>';
      } else {
        semaforoBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-[#00A88E] border border-emerald-200">Autónomo</span>';
      }

      colRiskHtml = `
        <div class="flex items-center justify-center space-x-1.5 font-mono text-[11px]">
          <div class="w-10 bg-slate-100 rounded-full h-1 overflow-hidden">
            <div class="h-1 rounded-full ${s.probReprobar > 60 ? 'bg-[#CC142E]' : s.probReprobar > 35 ? 'bg-amber-500' : 'bg-[#00A88E]'}" style="width: ${s.probReprobar}%"></div>
          </div>
          <span class="${s.probReprobar > 60 ? 'text-[#CC142E] font-semibold' : 'text-slate-600'}">${s.probReprobar}%</span>
        </div>
      `;

      if (s.causaCodigo === 'CR-01') causaColorClass = 'bg-red-50 text-[#CC142E] border-red-200';
      else if (s.causaCodigo === 'CR-02') causaColorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      else if (s.causaCodigo === 'CR-03') causaColorClass = 'bg-orange-50 text-orange-800 border-orange-200';
      else if (s.causaCodigo === 'CR-04') causaColorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      else if (s.causaCodigo === 'CR-05') causaColorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
      else if (s.causaCodigo === 'CR-06') causaColorClass = 'bg-emerald-50 text-[#00A88E] border-emerald-200';
    }

    const dpiBadge = s.isDpiCritical
      ? '<span class="ml-1 inline-block text-[9px] font-mono font-bold uppercase bg-amber-600 text-white px-1 py-0.2 rounded">DPI</span>'
      : '';

    const tareaClass = s.tareasAvg >= 12 ? 'text-slate-800' : 'text-[#CC142E] font-semibold';

    const causaBadge = `<span class="table-tooltip-trigger inline-flex items-center justify-center min-w-[58px] px-2.5 py-1 rounded text-xs font-mono font-bold border cursor-help transition-all shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 ${causaColorClass}" data-tooltip-code="${s.causaCodigo || 'C-00'}" data-tooltip-title="${escapeAttr(s.causaTag || 'Diagnóstico')}" data-tooltip-body="${escapeAttr(s.diagnostico)}" data-tooltip-type="causa">${s.causaCodigo || 'C-00'}</span>`;

    const accionBadge = `<span class="table-tooltip-trigger inline-flex items-center justify-center min-w-[62px] px-2.5 py-1 rounded text-xs font-mono font-bold border cursor-help transition-all shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 ${accionColorClass}" data-tooltip-code="${s.accionCodigo || 'S-00'}" data-tooltip-title="${escapeAttr(s.accionTag || 'Acción')}" data-tooltip-body="${escapeAttr(s.accion)}" data-tooltip-type="accion">${s.accionCodigo || 'S-00'}</span>`;

    tr.innerHTML = `
      <td class="px-3.5 py-2 font-mono text-[11px] text-slate-500">${s.codigo}</td>
      <td class="px-3.5 py-2 font-medium text-slate-900">${s.nombre}</td>
      <td class="px-3.5 py-2 text-center text-slate-700 font-mono">
        ${s.asistPctLabel} ${dpiBadge}
      </td>
      ${hasTasks ? `
        <td class="px-3.5 py-2 text-center font-mono ${tareaClass}">
          <div>${s.tareasAvgLabel}</div>
          <div class="text-[9px] text-slate-400 font-sans font-normal">${s.tasksDeliveredCount}/${s.totalExpectedWeeks} entregadas</div>
        </td>
      ` : ''}
      ${hasPart ? `<td class="px-3.5 py-2 text-center font-mono text-slate-600">${s.partAvgLabel}</td>` : ''}
      <td class="px-3.5 py-2 text-center font-mono text-slate-700">${s.examsAvg}</td>
      <td class="px-3.5 py-2 text-center">${colRiskHtml}</td>
      <td class="px-3.5 py-2 text-center">${semaforoBadge}</td>
      <td class="px-3.5 py-2 text-center whitespace-nowrap">${causaBadge}</td>
      <td class="px-3.5 py-2 text-center whitespace-nowrap">${accionBadge}</td>
    `;

    tbody.appendChild(tr);
  });

  renderDashboardPagination(totalFiltered, totalPages);
}

function renderDashboardPagination(total, totalPages) {
  let paginationContainer = document.getElementById('dashboard-pagination-container');
  if (!paginationContainer) {
    const parentContainer = document.querySelector('#view-dashboard .bg-white.rounded-lg.border.overflow-hidden');
    if (parentContainer) {
      const footer = document.createElement('div');
      footer.className = 'px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500';
      footer.innerHTML = `
        <span id="dashboard-pagination-label">Mostrando alumnos</span>
        <div id="dashboard-pagination-container" class="flex items-center space-x-1.5"></div>
      `;
      parentContainer.appendChild(footer);
      paginationContainer = document.getElementById('dashboard-pagination-container');
    }
  }

  if (!paginationContainer) return;
  paginationContainer.innerHTML = '';

  const labelEl = document.getElementById('dashboard-pagination-label');
  if (labelEl) {
    const start = total > 0 ? (AppState.dashboardPage - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(AppState.dashboardPage * PAGE_SIZE, total);
    labelEl.textContent = `Mostrando ${start} - ${end} de ${total} estudiantes diagnosticados`;
  }

  if (total <= PAGE_SIZE) {
    paginationContainer.classList.add('hidden');
    return;
  }
  paginationContainer.classList.remove('hidden');

  const currentPage = AppState.dashboardPage;

  const btnPrev = document.createElement('button');
  btnPrev.className = `px-2 py-0.5 rounded text-xs border font-medium inline-flex items-center gap-1 ${currentPage === 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`;
  btnPrev.innerHTML = '<span class="material-symbols-outlined text-xs leading-none">chevron_left</span> Anterior';
  btnPrev.disabled = currentPage === 1;
  btnPrev.addEventListener('click', () => {
    if (AppState.dashboardPage > 1) {
      AppState.dashboardPage--;
      renderDashboardTable();
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
    if (AppState.dashboardPage < totalPages) {
      AppState.dashboardPage++;
      renderDashboardTable();
    }
  });
  paginationContainer.appendChild(btnNext);
}

function setupAnalyticsCarousel() {
  const tabButtons = document.querySelectorAll('.carousel-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const slideIndex = parseInt(btn.dataset.slide, 10);
      switchAnalyticsSlide(slideIndex);
    });
  });

  const btnPrev = document.getElementById('btn-carousel-prev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      const current = getCurrentCourse();
      const availableIndices = getAvailableSlideIndices(current);
      const currentIdx = AppState.activeChartSlide ?? 0;
      let pos = availableIndices.indexOf(currentIdx);
      if (pos === -1) pos = 0;
      const prevPos = (pos - 1 + availableIndices.length) % availableIndices.length;
      switchAnalyticsSlide(availableIndices[prevPos]);
    });
  }

  const btnNext = document.getElementById('btn-carousel-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const current = getCurrentCourse();
      const availableIndices = getAvailableSlideIndices(current);
      const currentIdx = AppState.activeChartSlide ?? 0;
      let pos = availableIndices.indexOf(currentIdx);
      if (pos === -1) pos = 0;
      const nextPos = (pos + 1) % availableIndices.length;
      switchAnalyticsSlide(availableIndices[nextPos]);
    });
  }
}

export function switchAnalyticsSlide(index) {
  const current = getCurrentCourse();
  const availableIndices = getAvailableSlideIndices(current);

  if (!availableIndices.includes(index)) {
    index = availableIndices[0];
  }
  AppState.activeChartSlide = index;

  const tabButtons = document.querySelectorAll('.carousel-tab-btn');
  tabButtons.forEach(btn => {
    const slide = parseInt(btn.dataset.slide, 10);
    if (slide === index) {
      btn.className = 'carousel-tab-btn active px-2.5 py-1 rounded text-xs font-semibold bg-white text-slate-900 border border-slate-200 shadow-2xs transition whitespace-nowrap inline-flex items-center gap-1.5';
    } else {
      btn.className = 'carousel-tab-btn px-2.5 py-1 rounded text-xs font-medium text-slate-600 hover:text-slate-900 transition whitespace-nowrap inline-flex items-center gap-1.5';
    }
  });

  for (let i = 0; i < 4; i++) {
    const slideEl = document.getElementById(`slide-chart-${i}`);
    if (slideEl) {
      if (i === index) {
        slideEl.classList.remove('hidden');
      } else {
        slideEl.classList.add('hidden');
      }
    }
  }

  const counterEl = document.getElementById('carousel-slide-counter');
  if (counterEl) {
    const currentPos = availableIndices.indexOf(index);
    counterEl.textContent = `Análisis ${currentPos + 1} de ${availableIndices.length}`;
  }

  updateCarouselGuide(index, current);

  const chartKeys = ['donut', 'scatter', 'pareto', 'histogram'];
  const activeChart = AppState.charts[chartKeys[index]];
  if (activeChart && typeof activeChart.resize === 'function') {
    requestAnimationFrame(() => {
      activeChart.resize();
      activeChart.update('none');
    });
  }
}

function updateCarouselGuide(index, current) {
  const guideTitle = document.getElementById('carousel-guide-title');
  const guideBadge = document.getElementById('carousel-guide-badge');
  const guideDesc = document.getElementById('carousel-guide-description');
  const guideAction = document.getElementById('carousel-guide-action');

  if (!guideTitle || !guideBadge || !guideDesc || !guideAction) return;

  const results = (current && current.analyticsResults) || [];
  const total = results.length;

  if (total === 0) {
    guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-amber-500">lightbulb</span><span>Guía Didáctica para el Docente</span>';
    guideBadge.textContent = 'Sin Datos';
    guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold';
    guideDesc.innerHTML = '<p>Aún no hay datos de estudiantes cargados en esta sección.</p>';
    guideAction.textContent = 'Registra alumnos y calificaciones para visualizar los diagnósticos guiados.';
    return;
  }

  const greens = results.filter(s => s.semaforo === 'green').length;
  const yellows = results.filter(s => s.semaforo === 'yellow').length;
  const reds = results.filter(s => s.semaforo === 'red').length;

  const pctRed = Math.round((reds / total) * 100);
  const pctYellow = Math.round((yellows / total) * 100);
  const pctGreen = Math.round((greens / total) * 100);

  const isFinalClosure = (AppState.analysisCutoffWeek || 4) >= 18;

  if (isFinalClosure) {
    if (index === 0) {

      guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-[#CC142E]">donut_large</span><span>Balance Final del Semestre</span>';
      guideBadge.textContent = 'Resultados Oficiales';
      guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-slate-700 font-bold';

      guideDesc.innerHTML = `
        <p>El ciclo regular ha culminado. Así se distribuyen los resultados finales de tu sección:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600 mt-1">
          <li><strong class="text-[#00A88E]">${greens} alumnos Aprobados (${pctGreen}%)</strong>: Alcanzaron nota 12.0 o más y son promovidos directamente.</li>
          <li><strong class="text-amber-700">${yellows} alumnos en Subsanación (${pctYellow}%)</strong>: Tienen promedio entre 08 y 11.9. Tienen derecho a rendir examen de recuperación.</li>
          <li><strong class="text-[#CC142E]">${reds} alumnos que Repiten (${pctRed}%)</strong>: Promedio menor a 08 o inhabilitados por inasistencias (DPI).</li>
        </ul>
      `;
      guideAction.innerHTML = yellows > 0
        ? `Informa de inmediato a los <strong>${yellows} estudiante(s) en subsanación</strong> para que se inscriban al examen sustitutorio y no pierdan la oportunidad de aprobar.`
        : `¡Felicitaciones por culminar el ciclo! Ya puedes cerrar y refrendar las actas finales en el sistema institucional.`;

    } else if (index === 1) {

      guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-blue-600">scatter_plot</span><span>Asistencia vs. Promedio Final</span>';
      guideBadge.textContent = 'Cierre de Ciclo';
      guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold';

      const highAsistFailed = results.filter(s => s.asistPct >= 0.75 && s.promedioFinal < 12.0);

      guideDesc.innerHTML = `
        <p>Muestra cómo impactó la asistencia en el promedio final acumulado de cada estudiante:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600 mt-1">
          <li><strong>Asistieron pero no alcanzaron la nota (${highAsistFailed.length} alumnos):</strong> Vinieron puntuales pero tuvieron dificultades en tareas o el examen final.</li>
          <li><strong>Límite de faltas superado:</strong> Quienes tuvieron 30% o más de inasistencias quedan con condición DPI automáticamente sin derecho a examen.</li>
        </ul>
      `;
      guideAction.innerHTML = highAsistFailed.length > 0
        ? `Revisa si los <strong>${highAsistFailed.length} alumnos</strong> que asistieron pero no aprobaron están en rango de subsanación (nota ≥ 08) para motivarlos a rendir su examen.`
        : `Los resultados guardan relación directa entre asistencia y notas. Procede con el registro oficial de actas.`;

    } else if (index === 2) {

      guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-indigo-600">analytics</span><span>¿Por qué no aprobaron? (Causa Principal)</span>';
      guideBadge.textContent = 'Causa #1 del Salón';
      guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-bold';

      const pareto = calculateParetoData(results);
      const topCause = (pareto.labels && pareto.labels[0]) || 'Sin casos desaprobados';
      const topCount = (pareto.counts && pareto.counts[0]) || 0;

      guideDesc.innerHTML = `
        <p>El análisis Pareto de cierre identifica el motivo más común por el que los estudiantes tuvieron dificultades en el ciclo.</p>
        <p class="text-slate-700 mt-1">El factor principal detectado fue: <strong class="text-[#CC142E]">${topCause}</strong> (${topCount} estudiantes).</p>
        <p class="text-[10.5px] text-slate-500 italic mt-0.5">Conocer esta causa te permite ajustar las estrategias didácticas para tu siguiente semestre.</p>
      `;
      guideAction.innerHTML = `Para el próximo ciclo, presta atención temprana al factor <strong>"${topCause}"</strong> para evitar que se repita este patrón de reprobación.`;

    } else if (index === 3) {

      guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-emerald-600">bar_chart</span><span>Distribución de Promedios Finales (0 a 20)</span>';
      guideBadge.textContent = 'Aprobados vs Desaprobados';
      guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold';

      const histData = calculateHistogramData(results);
      const subsanacionCount = (histData.counts && histData.counts[2]) || 0;

      guideDesc.innerHTML = `
        <p>Muestra las notas finales definitivas de la cohorte frente a la nota mínima de <strong>12.0</strong>:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600 mt-1">
          <li><strong class="text-[#00A88E]">${histData.approvedCount} aprobados</strong> (promedio ≥ 12.0) vs. <strong class="text-[#CC142E]">${histData.disapprovedCount} desaprobados</strong>.</li>
          <li><strong>Aptos para examen de subsanación [08 - 11.9]:</strong> Hay <strong class="text-amber-700">${subsanacionCount} alumno(s)</strong> con derecho a dar sustitutorio.</li>
        </ul>
      `;
      guideAction.innerHTML = subsanacionCount > 0
        ? `Publica las notas finales en el aula virtual para que los <strong>${subsanacionCount} estudiantes en subsanación</strong> inicien su trámite y preparación con tiempo.`
        : `Felicidades por culminar las evaluaciones. Cierra el ciclo consolidando las notas en el sistema.`;
    }
    return;
  }

  const hasTasks = current ? current.hasTasks !== false : true;
  const hasPart = current ? current.hasParticipation !== false : true;

  if (index === 0) {

    guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-[#CC142E]">donut_large</span><span>Semáforo del Salón</span>';
    guideBadge.textContent = 'Resumen del Salón';
    guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-[#CC142E] font-bold';

    let greenBehavior = 'Asisten puntualmente y se preparan para sus evaluaciones sin faltas.';
    if (hasTasks) greenBehavior = 'Asisten, entregan sus tareas y van aprobando sin problemas.';
    else if (hasPart) greenBehavior = 'Asisten, participan en clase/foros y van aprobando sin problemas.';

    guideDesc.innerHTML = `
      <p>Te muestra de un vistazo cómo se divide tu salón en 3 grupos:</p>
      <ul class="list-disc pl-4 space-y-1 text-slate-600 mt-1">
        <li><strong class="text-[#CC142E]">${reds} alumnos en Peligro (${pctRed}%)</strong>: Necesitan tu ayuda urgente porque faltan mucho o tienen notas muy bajas.</li>
        <li><strong class="text-amber-700">${yellows} alumnos en Atención (${pctYellow}%)</strong>: Están con la nota justa (11 o 12); con un empujón aprueban.</li>
        <li><strong class="text-[#00A88E]">${greens} alumnos Al Día (${pctGreen}%)</strong>: ${greenBehavior}</li>
      </ul>
    `;
    guideAction.innerHTML = reds > 0
      ? (hasTasks
          ? `Habla primero con los <strong>${reds} alumno(s) en rojo</strong>. Con solo ayudarlos a ponerse al día con una tarea pendiente o justificar faltas, varios saldrán del peligro.`
          : (hasPart
              ? `Habla primero con los <strong>${reds} alumno(s) en rojo</strong>. Motívalos a participar en los foros continuos o justificar faltas antes de que aumente el riesgo.`
              : `Habla primero con los <strong>${reds} alumno(s) en rojo</strong>. Verifica las causas de sus inasistencias antes de la siguiente práctica calificada para evitar que queden inhabilitados por DPI.`))
      : `¡Tu salón va por buen camino! Haz un breve repaso para los ${yellows} alumnos en amarillo para que aseguren su nota.`;

  } else if (index === 1) {

    let scatterGradeTitle = 'Asistencia vs. Rendimiento en Exámenes';
    let scatterGradeBadge = 'Rendimiento en exámenes';
    let entityName = 'sus exámenes';
    let entityShort = 'en evaluaciones';
    let entityPending = 'salieron bajos en exámenes';

    if (hasTasks) {
      scatterGradeTitle = 'Asistencia vs. Cumplimiento de Tareas';
      scatterGradeBadge = 'Comportamiento en clase';
      entityName = 'sus tareas';
      entityShort = 'en tareas';
      entityPending = 'deben tareas';
    } else if (hasPart) {
      scatterGradeTitle = 'Asistencia vs. Participación en Foros';
      scatterGradeBadge = 'Participación continua';
      entityName = 'sus foros';
      entityShort = 'en foros';
      entityPending = 'deben foros';
    }

    guideTitle.innerHTML = `<span class="material-symbols-outlined text-base text-blue-600">scatter_plot</span><span>${scatterGradeTitle}</span>`;
    guideBadge.textContent = scatterGradeBadge;
    guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold';

    const passiveStudents = results.filter(s => s.asistPct >= 0.70 && (hasTasks ? s.tareasAvg < 12.0 : (hasPart ? s.partAvg < 12.0 : Number(s.examsAvg || 0) < 12.0)));
    const disconnectedStudents = results.filter(s => s.asistPct < 0.70 && (hasTasks ? s.tareasAvg < 12.0 : (hasPart ? s.partAvg < 12.0 : Number(s.examsAvg || 0) < 12.0)));

    guideDesc.innerHTML = `
      <p>Compara quiénes vienen a clase versus quiénes están aprobando ${entityName}:</p>
      <ul class="list-disc pl-4 space-y-1 text-slate-600 mt-1">
        <li><strong>Vienen pero no aprueban (${passiveStudents.length} alumnos):</strong> Asisten con regularidad, pero tienen bajas notas ${entityShort}. Sí tienen interés, pero les cuesta entender los temas o estudiar solos.</li>
        <li><strong>Desconectados (${disconnectedStudents.length} alumnos):</strong> Faltan seguido y ${entityPending}. Si nadie les escribe, pueden terminar abandonando el curso.</li>
      </ul>
    `;
    guideAction.innerHTML = passiveStudents.length > 0
      ? `A los <strong>${passiveStudents.length} alumnos que vienen pero no aprueban</strong>, el problema no es de faltas. Ponlos a trabajar en grupo con compañeros que dominen el tema o explícales los errores comunes en 5 minutos de clase.`
      : `No hay casos críticos de alumnos que vengan sin entender. Concéntrate en quienes tienen faltas seguidas para evitar que dejen el curso.`;

  } else if (index === 2) {

    guideTitle.innerHTML = '<span class="material-symbols-outlined text-base text-indigo-600">analytics</span><span>Problema Principal del Salón</span>';
    guideBadge.textContent = 'Causa #1 a solucionar';
    guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-bold';

    const pareto = calculateParetoData(results);
    let topCause = (pareto.labels && pareto.labels[0]) || (hasTasks ? 'Omisión de tareas' : (hasPart ? 'Baja participación en foros' : 'Inasistencias acumuladas'));
    if (!hasTasks && topCause === 'Omisión de tareas') {
      topCause = hasPart ? 'Baja participación en foros' : 'Inasistencias acumuladas';
    }
    const topCount = (pareto.counts && pareto.counts[0]) || 0;

    guideDesc.innerHTML = `
      <p>En vez de desgastarte intentando solucionar todo a la vez, esta gráfica te muestra cuál es la dificultad que más afecta a tus alumnos.</p>
      <p class="text-slate-700 mt-1">El problema #1 detectado en tu salón es: <strong class="text-[#CC142E]">${topCause}</strong> (${topCount} casos).</p>
      <p class="text-[10.5px] text-slate-500 italic mt-0.5">Si solucionas este problema principal primero, recuperarás a la gran mayoría de tus alumnos con el menor esfuerzo.</p>
    `;
    guideAction.innerHTML = hasTasks
      ? `Enfócate en atacar primero la causa <strong>"${topCause}"</strong>. Por ejemplo, si son tareas no entregadas, dales un recordatorio claro por Canvas o 2 días adicionales para que se nivelen.`
      : (hasPart
          ? `Enfócate en atacar primero la causa <strong>"${topCause}"</strong>. Abre un espacio en Canvas o durante la sesión síncrona para que completen sus participaciones pendientes.`
          : `Enfócate en atacar primero la causa <strong>"${topCause}"</strong>. Recuerda hacer seguimiento a las justificaciones de inasistencia antes de la siguiente práctica calificada.`);

  } else if (index === 3) {

    let histTitleText = 'Distribución de Notas de Examen (0 a 20)';
    let histBadgeText = 'Aprobados vs Desaprobados en PC';
    if (hasTasks) {
      histTitleText = '¿Cómo van las notas de tu salón? (0 a 20)';
      histBadgeText = 'Aprobados vs Desaprobados';
    } else if (hasPart) {
      histTitleText = 'Distribución de Notas de Foros (0 a 20)';
      histBadgeText = 'Aprobados vs Desaprobados en Foros';
    }

    guideTitle.innerHTML = `<span class="material-symbols-outlined text-base text-emerald-600">bar_chart</span><span>${histTitleText}</span>`;
    guideBadge.textContent = histBadgeText;
    guideBadge.className = 'text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold';

    const histData = calculateHistogramData(results, hasTasks);
    const borderlineCount = (histData.counts && histData.counts[2]) || 0;

    guideDesc.innerHTML = `
      <p>Te muestra cuántos alumnos están pasando el curso frente a la nota mínima aprobatoria (<strong>12.0</strong>):</p>
      <ul class="list-disc pl-4 space-y-1 text-slate-600 mt-1">
        <li><strong class="text-[#CC142E]">${histData.disapprovedCount} desaprobados</strong> (menos de 12.0) vs. <strong class="text-[#00A88E]">${histData.approvedCount} aprobados</strong> (12.0 a más).</li>
        <li><strong>Zona de rescate [11.0 - 11.9]:</strong> Hay <strong class="text-amber-600">${borderlineCount} alumno(s)</strong> a menos de 1 punto de pasar.</li>
      </ul>
    `;
    guideAction.innerHTML = borderlineCount > 0
      ? `Tienes <strong>${borderlineCount} alumno(s) con nota 11</strong> a punto de aprobar. Una retroalimentación puntual o una pregunta extra en la siguiente clase los hará pasar de inmediato.`
      : `Revisa a quienes tienen notas muy bajas ([0 - 5]) para confirmar si siguen asistiendo a tu clase o si dejaron el curso.`;
  }
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Configura el sistema de tooltips flotantes para la tabla de diagnósticos y planes de acción.
 * Estilo técnico y sobrio (sin iconos ni stickers), delegando eventos para soportar paginación y filtros.
 */
function setupTableTooltips() {
  let tooltip = document.getElementById('table-floating-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'table-floating-tooltip';
    tooltip.className = 'fixed z-[9999] pointer-events-none max-w-xs sm:max-w-sm bg-slate-900 text-slate-100 p-2.5 rounded-md text-xs shadow-xl border border-slate-700 opacity-0 transition-opacity duration-100 leading-relaxed font-sans';
    document.body.appendChild(tooltip);
  }

  const tableBody = document.getElementById('dashboard-table-body');
  if (!tableBody) return;

  tableBody.addEventListener('mouseover', (e) => {
    const trigger = e.target.closest('.table-tooltip-trigger');
    if (!trigger) return;

    const code = trigger.dataset.tooltipCode || '';
    const title = trigger.dataset.tooltipTitle || '';
    const body = trigger.dataset.tooltipBody || '';
    const type = trigger.dataset.tooltipType || 'causa';

    const isFinalClosure = (AppState.analysisCutoffWeek || 4) >= 18;
    const categoryLabel = type === 'causa'
      ? (isFinalClosure ? '¿Por qué obtuvo este resultado?' : '¿Qué le pasa al alumno?')
      : (isFinalClosure ? 'Situación académica / Trámite' : '¿Qué debes hacer tú?');

    const tagBg = type === 'causa'
      ? 'bg-rose-950 text-rose-300 border-rose-800'
      : 'bg-sky-950 text-sky-300 border-sky-800';

    tooltip.innerHTML = `
      <div class="text-[10px] font-mono tracking-wider text-slate-400 font-semibold uppercase mb-1">
        ${categoryLabel}
      </div>
      <div class="flex items-center space-x-2 border-b border-slate-700 pb-1.5 mb-2">
        <span class="font-mono text-xs font-bold px-1.5 py-0.5 rounded border ${tagBg}">${escapeAttr(code)}</span>
        <span class="font-sans font-bold text-xs text-white">${escapeAttr(title)}</span>
      </div>
      <div class="text-slate-200 text-xs leading-relaxed font-sans">
        ${escapeAttr(body)}
      </div>
    `;

    tooltip.style.opacity = '1';
  });

  tableBody.addEventListener('mousemove', (e) => {
    const trigger = e.target.closest('.table-tooltip-trigger');
    if (!trigger) {
      tooltip.style.opacity = '0';
      return;
    }

    const offset = 14;
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = e.clientX + offset;
    let top = e.clientY + offset;

    if (left + tooltipRect.width > window.innerWidth - 12) {
      left = e.clientX - tooltipRect.width - offset;
    }
    if (top + tooltipRect.height > window.innerHeight - 12) {
      top = e.clientY - tooltipRect.height - offset;
    }

    if (left < 10) left = 10;
    if (top < 10) top = 10;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });

  tableBody.addEventListener('mouseout', (e) => {
    const trigger = e.target.closest('.table-tooltip-trigger');
    if (!trigger) return;
    const related = e.relatedTarget;
    if (related && trigger.contains(related)) return;
    tooltip.style.opacity = '0';
  });

  window.addEventListener('scroll', () => {
    if (tooltip && tooltip.style.opacity !== '0') {
      tooltip.style.opacity = '0';
    }
  }, { passive: true });
}
