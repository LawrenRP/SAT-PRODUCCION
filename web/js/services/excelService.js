import { createEmptyStudent } from '../state.js';
import { REGULAR_WEEKS } from '../constants.js';
import { showToast } from '../components/notifications.js';

export const OFFICIAL_46_HEADERS = [
  'Código', 'Apellidos y Nombres',
  'Asist. S1', 'Tarea S1', 'Part/Foro S1',
  'Asist. S2', 'Tarea S2', 'Part/Foro S2',
  'Asist. S3', 'Tarea S3', 'Part/Foro S3',
  'Asist. S4', 'Tarea S4', 'Part/Foro S4',
  'PC1 (Sem 5)',
  'Asist. S6', 'Tarea S6', 'Part/Foro S6',
  'Asist. S7', 'Tarea S7', 'Part/Foro S7',
  'Asist. S8', 'Tarea S8', 'Part/Foro S8',
  'Asist. S9', 'Tarea S9', 'Part/Foro S9',
  'PC2 (Sem 10)',
  'Asist. S11', 'Tarea S11', 'Part/Foro S11',
  'Asist. S12', 'Tarea S12', 'Part/Foro S12',
  'Asist. S13', 'Tarea S13', 'Part/Foro S13',
  'Asist. S14', 'Tarea S14', 'Part/Foro S14',
  'PC3 (Sem 15)',
  'Asist. S16', 'Tarea S16', 'Part/Foro S16',
  'PA (Sem 17)',
  'PC4/Final (Sem 18)'
];

export function buildInstructionsSheet(course) {
  const data = [
    [],
    ['', `SISTEMA DE ALERTA TEMPRANA UNIVERSITARIA (EWS) — UTP`],
    ['', `Asignatura: ${course ? course.name : ''} | Código de Sección: ${course ? course.section : ''}`],
    ['', 'Estructura oficial para registro de asistencia, tareas semanales, foros y evaluaciones sumativas (18 semanas).'],
    [],
    ['', '1. Escala de Calificaciones', 'Todas las notas se registran en escala vigesimal (0.00 a 20.00). La nota mínima aprobatoria es 12.00.'],
    ['', '2. Registro de Asistencias', `${course ? course.sessionsPerWeek : 2} sesión(es) semanal(es): 0 = Inasistencia, 1 = Asistió (en 1 sesión), 2 = Asistencia completa (en dual).`],
    ['', '3. Regla UTP de DPI', 'El sistema monitorea activamente el umbral del 30% de faltas reglamentarias acumuladas.'],
    ['', '4. Hitos Sumativos:', 'Semana 5 (PC1) | Semana 10 (PC2) | Semana 15 (PC3) | Semana 17 (PA) | Semana 18 (PC4/Final).']
  ];
  return window.XLSX.utils.aoa_to_sheet(data);
}

export function downloadOfficialTemplate() {
  const link = document.createElement('a');
  link.href = 'assets/Plantilla_Oficial_EWS_UTP.xlsx';
  link.download = 'Plantilla_Oficial_EWS_UTP.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStudentsToExcel(course) {
  if (!course) return;

  const valid = course.students.filter(s => (s.codigo && s.codigo.trim()) || (s.nombre && s.nombre.trim()));
  if (valid.length === 0) {
    showToast(`No hay estudiantes registrados en "${course.name}".`, 'warning');
    return;
  }

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, buildInstructionsSheet(course), 'INSTRUCCIONES');

  const sheetData = [OFFICIAL_46_HEADERS];
  valid.forEach(s => {
    const row = new Array(46).fill(null);
    row[0] = s.codigo;
    row[1] = s.nombre;
    sheetData.push(row);
  });

  const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
  window.XLSX.utils.book_append_sheet(wb, ws, 'REGISTRO_CALIFICACIONES');

  const cleanName = course.name.replace(/[^a-zA-Z0-9]/g, '_');
  window.XLSX.writeFile(wb, `Nomina_${cleanName}_Sec_${course.section}.xlsx`);
  showToast('Nómina descargada en Excel.', 'success');
}

export function exportFullExcel(course) {
  if (!course) return;

  const valid = course.students.filter(s => (s.codigo && s.codigo.trim()) || (s.nombre && s.nombre.trim()));
  if (valid.length === 0) {
    showToast('No hay estudiantes para exportar.', 'warning');
    return;
  }

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, buildInstructionsSheet(course), 'INSTRUCCIONES');

  const sheetData = [OFFICIAL_46_HEADERS];
  valid.forEach(s => {
    const row = new Array(46).fill(null);
    row[0] = s.codigo;
    row[1] = s.nombre;

    [1, 2, 3, 4].forEach((w, i) => {
      const base = 2 + i * 3;
      row[base] = s[`asist_s${w}`] !== '' ? s[`asist_s${w}`] : null;
      row[base + 1] = s[`tarea_s${w}`] !== '' ? s[`tarea_s${w}`] : null;
      row[base + 2] = s[`foro_s${w}`] !== '' ? s[`foro_s${w}`] : null;
    });

    row[14] = s.pc1 !== '' ? s.pc1 : null;

    [6, 7, 8, 9].forEach((w, i) => {
      const base = 15 + i * 3;
      row[base] = s[`asist_s${w}`] !== '' ? s[`asist_s${w}`] : null;
      row[base + 1] = s[`tarea_s${w}`] !== '' ? s[`tarea_s${w}`] : null;
      row[base + 2] = s[`foro_s${w}`] !== '' ? s[`foro_s${w}`] : null;
    });

    row[27] = s.pc2 !== '' ? s.pc2 : null;

    [11, 12, 13, 14].forEach((w, i) => {
      const base = 28 + i * 3;
      row[base] = s[`asist_s${w}`] !== '' ? s[`asist_s${w}`] : null;
      row[base + 1] = s[`tarea_s${w}`] !== '' ? s[`tarea_s${w}`] : null;
      row[base + 2] = s[`foro_s${w}`] !== '' ? s[`foro_s${w}`] : null;
    });

    row[40] = s.pc3 !== '' ? s.pc3 : null;

    row[41] = s.asist_s16 !== '' ? s.asist_s16 : null;
    row[42] = s.tarea_s16 !== '' ? s.tarea_s16 : null;
    row[43] = s.foro_s16 !== '' ? s.foro_s16 : null;

    row[44] = s.pa !== '' ? s.pa : null;

    row[45] = s.pc4 !== '' ? s.pc4 : null;

    sheetData.push(row);
  });

  const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
  window.XLSX.utils.book_append_sheet(wb, ws, 'REGISTRO_CALIFICACIONES');

  const cleanName = course.name.replace(/[^a-zA-Z0-9]/g, '_');
  window.XLSX.writeFile(wb, `Registro_Completo_${cleanName}_Sec_${course.section}_18Semanas.xlsx`);
}

export function exportDiagnosticsExcel(course) {
  if (!course) return;

  const results = course.analyticsResults || [];
  if (results.length === 0) {
    showToast('No hay diagnósticos calculados para exportar.', 'warning');
    return;
  }

  const isFinalClosure = results.some(s => s.isFinalClosure);

  let exportRows;
  let sheetName;
  let fileName;

  if (isFinalClosure) {
    sheetName = 'BALANCE_FINAL_S18';
    exportRows = results.map(s => {
      const base = {
        'Código': s.codigo,
        'Estudiante': s.nombre,
        'Asistencia (%)': s.asistPctLabel,
        'Condición DPI': s.isDpiCritical ? 'DPI (≥30%)' : 'REGULAR',
        'Promedio Tareas': Number(s.tareasAvg.toFixed(2)),
      };

      if (course.hasParticipation) {
        base['Promedio Foros'] = Number(s.partAvg.toFixed(2));
      }

      base['Exámenes'] = s.examsAvg;
      base['Promedio Final (PF)'] = Number(s.promedioFinal.toFixed(2));
      base['Condición Oficial'] = s.condicionFinal;
      base['Código Causa'] = s.causaCodigo || '';
      base['Causa del Resultado'] = s.diagnostico;
      base['Código Situación'] = s.accionCodigo || '';
      base['Situación Académica / Trámite'] = s.accion;

      return base;
    });

    const cleanName = course.name.replace(/[^a-zA-Z0-9]/g, '_');
    fileName = `Balance_Final_${cleanName}_Sec_${course.section}_S18.xlsx`;
  } else {
    sheetName = 'DIAGNOSTICO_EWS';
    exportRows = results.map(s => {
      const base = {
        'Código': s.codigo,
        'Estudiante': s.nombre,
        'Asistencia (%)': s.asistPctLabel,
        'Alerta DPI': s.isDpiCritical ? 'SÍ (≥30%)' : 'NO',
        'Promedio Tareas': Number(s.tareasAvg.toFixed(2)),
      };

      if (course.hasParticipation) {
        base['Promedio Foros'] = Number(s.partAvg.toFixed(2));
      }

      base['Probabilidad Reprobar'] = `${s.probReprobar}%`;
      base['Semáforo'] = s.semaforo.toUpperCase();
      base['Código Causa'] = s.causaCodigo || '';
      base['Diagnóstico Causa-Raíz'] = s.diagnostico;
      base['Código Acción'] = s.accionCodigo || '';
      base['Acción Sugerida'] = s.accion;

      return base;
    });

    const cleanName = course.name.replace(/[^a-zA-Z0-9]/g, '_');
    fileName = `Reporte_Diagnostico_${cleanName}_Sec_${course.section}.xlsx`;
  }

  const ws = window.XLSX.utils.json_to_sheet(exportRows);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, sheetName);

  window.XLSX.writeFile(wb, fileName);
  showToast(isFinalClosure ? 'Balance final semestral exportado a Excel.' : 'Diagnósticos exportados a Excel.', 'success');
}

export function parseUploadedExcel(file, course, onSuccess, onError) {
  if (!course) {
    showToast('Primero debes crear un curso y sección antes de importar alumnos.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = window.XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames.includes('REGISTRO_CALIFICACIONES')
        ? 'REGISTRO_CALIFICACIONES'
        : workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        if (onError) onError('El archivo no contiene filas de estudiantes.');
        return;
      }

      const maxAsist = course.sessionsPerWeek || 1;
      const parseGrade = (val) => (val !== '' && !isNaN(Number(val))) ? Math.min(20, Math.max(0, Number(val))) : '';

      const importedStudents = jsonData.map(r => {
        const rawCode = r['Código'] || r['codigo'] || r['codigo_estudiante'] || '';
        const rawName = r['Apellidos y Nombres'] || r['apellidos_nombres'] || r['nombre'] || '';

        const cleanName = String(rawName).replace(/[0-9]/g, '').trim();

        const student = createEmptyStudent(rawCode, cleanName);

        REGULAR_WEEKS.forEach(w => {
          let rawAsist = r[`Asist. S${w}`] ?? r[`asist_s${w}`] ?? '';
          if (rawAsist !== '' && !isNaN(Number(rawAsist))) {
            student[`asist_s${w}`] = Math.min(maxAsist, Math.max(0, Math.round(Number(rawAsist))));
          } else {
            student[`asist_s${w}`] = '';
          }

          let rawTarea = r[`Tarea S${w}`] ?? r[`tarea_s${w}`] ?? '';
          student[`tarea_s${w}`] = parseGrade(rawTarea);

          let rawForo = r[`Part/Foro S${w}`] ?? r[`foro_s${w}`] ?? '';
          student[`foro_s${w}`] = parseGrade(rawForo);
        });

        student.pc1 = parseGrade(r['PC1 (Sem 5)'] ?? r['PC1'] ?? r['pc1'] ?? '');
        student.pc2 = parseGrade(r['PC2 (Sem 10)'] ?? r['PC2'] ?? r['pc2'] ?? '');
        student.pc3 = parseGrade(r['PC3 (Sem 15)'] ?? r['PC3'] ?? r['pc3'] ?? '');
        student.pa = parseGrade(r['PA (Sem 17)'] ?? r['PA'] ?? r['pa'] ?? '');
        student.pc4 = parseGrade(r['PC4/Final (Sem 18)'] ?? r['PC4'] ?? r['pc4'] ?? r['Final'] ?? '');

        return student;
      });

      course.students = importedStudents;
      if (onSuccess) onSuccess(importedStudents);
    } catch (err) {
      console.error(err);
      if (onError) onError('Error al procesar el archivo Excel. Verifica el formato.');
    }
  };
  reader.readAsArrayBuffer(file);
}
