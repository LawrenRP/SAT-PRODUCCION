import { PEDAGOGICAL_RULES, REGULAR_WEEKS, EVALUATION_MILESTONES } from '../constants.js';

export function calculateStudentMetrics(student, sessionsPerWeek = 2, hasParticipation = true, cutoffWeek = 4, hasTasks = true) {
  const codigo = student.codigo || 'S/C';
  const nombre = student.nombre || 'Estudiante';

  const activeRegularWeeks = REGULAR_WEEKS.filter(w => w <= cutoffWeek);
  const totalPossibleSessions = activeRegularWeeks.length * sessionsPerWeek;

  const totalExpectedWeeks = activeRegularWeeks.length;
  let totalSessionsAttended = 0;
  let sumTareas = 0;
  let sumPart = 0;
  let tasksDeliveredCount = 0;
  let partDeliveredCount = 0;
  let consecutiveAbsences = 0;
  let currentStreakAbsence = 0;

  activeRegularWeeks.forEach(w => {

    let asistVal = (student[`asist_s${w}`] !== '' && !isNaN(Number(student[`asist_s${w}`])))
      ? Number(student[`asist_s${w}`])
      : 0;

    if (asistVal > sessionsPerWeek) asistVal = sessionsPerWeek;
    totalSessionsAttended += asistVal;

    if (asistVal === 0) {
      currentStreakAbsence++;
      if (currentStreakAbsence > consecutiveAbsences) consecutiveAbsences = currentStreakAbsence;
    } else {
      currentStreakAbsence = 0;
    }

    if (hasTasks) {
      let rawTarea = student[`tarea_s${w}`];
      let tareaVal = 0;
      if (rawTarea !== '' && !isNaN(Number(rawTarea))) {
        tareaVal = Math.min(20, Math.max(0, Number(rawTarea)));
        tasksDeliveredCount++;
      }
      sumTareas += tareaVal;
    }

    if (hasParticipation) {
      let rawForo = student[`foro_s${w}`];
      let foroVal = 0;
      if (rawForo !== '' && !isNaN(Number(rawForo))) {
        foroVal = Math.min(20, Math.max(0, Number(rawForo)));
        partDeliveredCount++;
      }
      sumPart += foroVal;
    }
  });

  const asistPct = totalPossibleSessions > 0 ? (totalSessionsAttended / totalPossibleSessions) : 1;
  const tareasAvg = (hasTasks && totalExpectedWeeks > 0) ? (sumTareas / totalExpectedWeeks) : 0;
  const partAvg = (hasParticipation && totalExpectedWeeks > 0) ? (sumPart / totalExpectedWeeks) : 0;

  const hasContinuous = hasTasks || hasParticipation;
  const contAvg = (hasTasks && hasParticipation)
    ? ((tareasAvg * 0.5) + (partAvg * 0.5))
    : (hasTasks ? tareasAvg : (hasParticipation ? partAvg : 0));
  const contLabel = (hasTasks && hasParticipation) ? 'tareas y foros' : (hasTasks ? 'tareas' : 'participación / foros');

  const inasistenciaPct = (1 - asistPct) * 100;
  const isDpiCritical = inasistenciaPct >= PEDAGOGICAL_RULES.DPI_INASISTENCIA_PCT;

  const pastExams = EVALUATION_MILESTONES.filter(e => e.week <= cutoffWeek);
  let examScores = [];
  pastExams.forEach(e => {
    if (student[e.key] !== '' && !isNaN(Number(student[e.key]))) {
      examScores.push(Number(student[e.key]));
    }
  });
  const examsAvg = examScores.length > 0 ? (examScores.reduce((a, b) => a + b, 0) / examScores.length) : null;

  const isFinalClosure = cutoffWeek >= 18;
  const isSummativeOnly = !hasTasks && !hasParticipation;

  const pc1 = (student.pc1 !== '' && student.pc1 !== undefined && !isNaN(Number(student.pc1))) ? Number(student.pc1) : null;
  const pc2 = (student.pc2 !== '' && student.pc2 !== undefined && !isNaN(Number(student.pc2))) ? Number(student.pc2) : null;
  const pc3 = (student.pc3 !== '' && student.pc3 !== undefined && !isNaN(Number(student.pc3))) ? Number(student.pc3) : null;
  const rawPa = (student.pa !== '' && student.pa !== undefined && !isNaN(Number(student.pa))) ? Number(student.pa) : null;
  const pc4 = (student.pc4 !== '' && student.pc4 !== undefined && !isNaN(Number(student.pc4))) ? Number(student.pc4) : null;

  let promedioFinal = 0;

  if (isSummativeOnly) {

    const hasExamsData = (pc1 !== null || pc2 !== null || pc3 !== null || pc4 !== null);
    if (hasExamsData) {
      promedioFinal = (Number(pc1 || 0) * 0.20) +
                      (Number(pc2 || 0) * 0.20) +
                      (Number(pc3 || 0) * 0.20) +
                      (Number(pc4 || 0) * 0.40);
    }
  } else {

    const fallbackPa = contAvg;
    const effectivePa = rawPa !== null ? rawPa : Math.round(fallbackPa * 10) / 10;

    const hasExamsData = (pc1 !== null || pc2 !== null || pc3 !== null || rawPa !== null || pc4 !== null);
    if (hasExamsData) {
      promedioFinal = (Number(pc1 || 0) * 0.20) +
                      (Number(pc2 || 0) * 0.20) +
                      (Number(pc3 || 0) * 0.20) +
                      (Number(effectivePa || 0) * 0.10) +
                      (Number(pc4 || 0) * 0.30);
    } else {
      promedioFinal = effectivePa;
    }
  }
  promedioFinal = Math.min(20, Math.max(0, Math.round(promedioFinal * 100) / 100));

  let prob = 0;
  let semaforo = 'green';
  let condicionFinal = '';
  let diagnostico = '';
  let accion = '';
  let causaCodigo = 'CR-06';
  let causaTag = 'Va muy bien / Al día';
  let accionCodigo = 'ACT-06';
  let accionTag = 'Felicitar y motivar';

  if (isFinalClosure) {

    if (isDpiCritical) {
      condicionFinal = 'DPI';
      semaforo = 'red';
      prob = 100;
      causaCodigo = 'C-DPI';
      causaTag = 'Inasistencias (DPI)';
      diagnostico = `Superó el límite permitido de faltas en el ciclo con ${Math.round(inasistenciaPct)}% de inasistencias. Por reglamento queda inhabilitado por inasistencia (DPI).`;
      accionCodigo = 'S-REPETIR';
      accionTag = 'Sin derecho a examen';
      accion = 'Por condición DPI, no tiene derecho a rendir examen de subsanación. Debe volver a matricularse en la asignatura en el siguiente ciclo.';
    } else if (promedioFinal >= PEDAGOGICAL_RULES.MIN_PASSING_GRADE) {
      condicionFinal = 'APROBADO';
      semaforo = 'green';
      prob = 0;

      if (promedioFinal >= 16.0) {
        causaCodigo = 'C-DEST';
        causaTag = 'Rendimiento Destacado';
        diagnostico = `Mantuvo un desempeño sobresaliente en tareas, evaluaciones y asistencia durante todo el curso, logrando un promedio final de ${promedioFinal.toFixed(2)}.`;
      } else {
        causaCodigo = 'C-APROB';
        causaTag = 'Aprobó con éxito';
        diagnostico = `Cumplió satisfactoriamente con las competencias del curso y aprobó las evaluaciones con un promedio final de ${promedioFinal.toFixed(2)}.`;
      }

      accionCodigo = 'S-PROMOVIDO';
      accionTag = 'Aprobado y Promovido';
      accion = 'Estudiante aprobado. Corresponde cerrar y refrendar su nota en el acta final consolidada.';
    } else {

      condicionFinal = 'DESAPROBADO';
      prob = 100;

      if (pc4 !== null && pc4 < 10 && ((pc1 !== null && pc1 >= 11) || (pc2 !== null && pc2 >= 11) || tareasAvg >= 12)) {
        causaCodigo = 'C-FINAL';
        causaTag = 'Cayó en Examen Final';
        diagnostico = `Mantuvo un rendimiento aceptable en el ciclo, pero obtuvo una calificación muy baja en la evaluación final (${pc4.toFixed(1)}), lo que bajó drásticamente su promedio.`;
      } else if (hasContinuous && (contAvg < 11.0 || (hasTasks ? tasksDeliveredCount : partDeliveredCount) < (totalExpectedWeeks * 0.7))) {
        causaCodigo = 'C-TAREAS';
        causaTag = hasTasks ? 'Omitió tareas continuas' : 'Baja participación / foros';
        diagnostico = hasTasks
          ? `No entregó oportunamente las tareas continuas del ciclo o tuvo calificaciones insuficientes en sus trabajos prácticos semanales.`
          : `No participó oportunamente en los foros continuos del ciclo o tuvo calificaciones insuficientes en sus intervenciones semanales.`;
      } else {
        causaCodigo = 'C-NOTAS';
        causaTag = 'Promedio insuficiente';
        diagnostico = `El rendimiento general acumulado en las evaluaciones del curso no alcanzó la nota mínima de 12.0 para aprobar directamente.`;
      }

      if (promedioFinal >= 8.0) {
        semaforo = 'yellow';
        accionCodigo = 'S-SUBSANAR';
        accionTag = 'Apto para Subsanación';
        accion = `Su promedio final (${promedioFinal.toFixed(2)}) le permite rendir el Examen de Subsanación o Sustitutorio. Indícale los plazos de inscripción y el temario a repasar.`;
      } else {
        semaforo = 'red';
        accionCodigo = 'S-REPETIR';
        accionTag = 'Repite Asignatura';
        accion = `Su promedio final (${promedioFinal.toFixed(2)}) no alcanza el mínimo reglamentario para rendir subsanación (nota < 08). Deberá cursar la materia nuevamente.`;
      }
    }
  } else {

    if (isSummativeOnly) {

      if (asistPct < 0.60) prob += 55;
      else if (asistPct < 0.75) prob += 35;
      else if (asistPct < 0.85) prob += 15;

      if (consecutiveAbsences >= 2) prob += 20;

      if (examsAvg !== null) {
        if (examsAvg < 10) prob += 40;
        else if (examsAvg < 12) prob += 20;
      }

      prob = Math.min(99, Math.max(1, Math.round(prob)));

      if (prob >= 60 || isDpiCritical || (examsAvg !== null && examsAvg < 10)) {
        semaforo = 'red';
      } else if (prob >= 35 || asistPct < 0.75 || (examsAvg !== null && examsAvg < 12.5)) {
        semaforo = 'yellow';
      }
    } else {
      if (hasContinuous) {
        if (contAvg < 10) prob += 50;
        else if (contAvg < 12) prob += 30;
        else if (contAvg < 14) prob += 15;
        else prob += 5;
      }

      if (asistPct < 0.60) prob += 35;
      else if (asistPct < 0.75) prob += 20;
      else if (asistPct < 0.85) prob += 10;

      if (consecutiveAbsences >= 2) prob += 15;

      if (examsAvg !== null) {
        if (examsAvg < 10) prob += 20;
        else if (examsAvg < 12) prob += 10;
      }

      prob = Math.min(99, Math.max(1, Math.round(prob)));

      if (prob >= 60 || isDpiCritical || (hasContinuous && contAvg < 10) || (examsAvg !== null && examsAvg < 10)) {
        semaforo = 'red';
      } else if (prob >= 35 || (hasContinuous && contAvg < 12.5) || asistPct < 0.75 || (examsAvg !== null && examsAvg < 12.5)) {
        semaforo = 'yellow';
      }
    }

    if (hasContinuous && isDpiCritical && contAvg < 10) {
      causaCodigo = 'CR-01';
      causaTag = 'Desconectado del curso';
      diagnostico = `Falta bastante a clases y no registra avances en ${contLabel} o tiene notas muy bajas. Está en grave riesgo de perder el curso por abandono.`;
      accionCodigo = 'ACT-01';
      accionTag = 'Hablar con el alumno hoy';
      accion = 'Escríbele o conversa con él hoy mismo. Pregúntale qué dificultad tiene y dale una oportunidad o fecha límite para ponerse al día antes de que sea tarde.';
    } else if (isDpiCritical) {
      causaCodigo = 'CR-02';
      causaTag = 'Límite de faltas (DPI)';
      diagnostico = `Tiene demasiadas faltas (${Math.round(inasistenciaPct)}% acumulado). Si falta una vez más, quedará fuera del curso por inasistencia (DPI).`;
      accionCodigo = 'ACT-02';
      accionTag = 'Advertir sobre sus faltas';
      accion = 'Avísale de inmediato que está al borde del límite de faltas permitidas. Si faltó por trabajo o salud, recuérdale presentar su justificación a tiempo.';
    } else if (hasContinuous && contAvg < 10 && asistPct >= 0.80) {
      causaCodigo = 'CR-03';
      causaTag = 'Asiste pero no comprende';
      diagnostico = `Viene a casi todas las clases pero sus notas en ${contLabel} son muy bajas. Quiere aprender, pero no logra entender los temas o estudiar solo.`;
      accionCodigo = 'ACT-03';
      accionTag = 'Apoyo o tutor de apoyo';
      accion = 'Como sí asiste, tiene interés. Siéntalo con un compañero que domine el tema para que lo guíe, o explícale en 5 minutos los errores clave de sus actividades.';
    } else if (!hasContinuous && examsAvg !== null && examsAvg < 10 && asistPct >= 0.80) {
      causaCodigo = 'CR-03';
      causaTag = 'Asiste pero rinde bajo';
      diagnostico = 'Viene a casi todas las clases pero obtuvo una calificación insuficiente en sus exámenes. Requiere reforzar temas teóricos y resolución práctica de evaluaciones.';
      accionCodigo = 'ACT-03';
      accionTag = 'Tutoría de examen';
      accion = 'Como asiste con regularidad, tiene compromiso. Revisa con él los puntos débiles de su última evaluación y facilítale ejercicios resueltos tipo examen.';
    } else if (consecutiveAbsences >= 2) {
      causaCodigo = 'CR-04';
      causaTag = 'Faltó a las últimas clases';
      diagnostico = 'Lleva dos o más clases seguidas sin asistir. Cuando un alumno falta seguido, suele desanimarse y dejar el curso si nadie le escribe.';
      accionCodigo = 'ACT-04';
      accionTag = 'Mandar mensaje de rescate';
      accion = 'Mándale un mensaje corto y amable por Canvas o correo: "Hola, vi que faltaste a clase, ¿todo bien? Te comparto el material para que no te atrases".';
    } else if (semaforo === 'yellow') {
      causaCodigo = 'CR-05';
      causaTag = 'En la cuerda floja (11-12)';
      diagnostico = 'Está con la nota justa para aprobar (promedio entre 11 y 12). Cualquier descuido en la siguiente práctica o examen lo puede hacer jalar.';
      accionCodigo = 'ACT-05';
      accionTag = 'Repaso antes de evaluar';
      accion = 'Dile exactamente en qué preguntas suele equivocarse y dale un tip o ejercicio parecido al examen para que asegure su nota aprobatoria.';
    } else {
      causaCodigo = 'CR-06';
      causaTag = 'Va muy bien / Al día';
      diagnostico = isSummativeOnly
        ? 'Asiste puntual y mantiene un registro de asistencia óptimo. Su avance en el curso es constante hacia las evaluaciones sumativas.'
        : 'Asiste puntual, entrega sus trabajos y tiene buenas notas. Su avance en el curso es constante y sin inconvenientes.';
      accionCodigo = 'ACT-06';
      accionTag = 'Felicitar y motivar';
      accion = 'Felicítalo por su esfuerzo y anímalo a seguir así. También puedes invitarlo a apoyar a sus compañeros en trabajos grupales.';
    }
  }

  return {
    id: student.id,
    codigo,
    nombre,
    asistPct,
    asistPctLabel: `${Math.round(asistPct * 100)}%`,
    tareasAvg,
    tareasAvgLabel: tareasAvg.toFixed(2),
    tasksDeliveredCount,
    totalExpectedWeeks,
    partAvg,
    partAvgLabel: partAvg.toFixed(2),
    examsAvg: examsAvg !== null ? examsAvg.toFixed(2) : '—',
    isDpiCritical,
    probReprobar: prob,
    semaforo,
    isFinalClosure,
    promedioFinal,
    promedioFinalLabel: promedioFinal.toFixed(2),
    condicionFinal,
    causaCodigo,
    causaTag,
    diagnostico,
    accionCodigo,
    accionTag,
    accion,
    hasTasks,
    hasParticipation,
  };
}

export function computeCourseAnalytics(course, cutoffWeek = 4) {
  if (!course || !Array.isArray(course.students)) return [];

  const sessionsPerWeek = course.sessionsPerWeek || 2;
  const hasParticipation = course.hasParticipation !== false;
  const hasTasks = course.hasTasks !== false;

  course.analyticsResults = course.students.map(s =>
    calculateStudentMetrics(s, sessionsPerWeek, hasParticipation, cutoffWeek, hasTasks)
  );

  return course.analyticsResults;
}

export function calculateCourseKpis(analyticsResults) {
  const total = analyticsResults.length;
  if (total === 0) {
    return {
      total: 0,
      criticos: 0,
      monitoreo: 0,
      autonomos: 0,
      dpiCount: 0,
      promedioTareas: '0.00',
      promedioFinal: '0.00',
      retencionPct: 100,
      aprobadosCount: 0,
      desaprobadosCount: 0,
      aprobadosPct: 100,
      desaprobadosPct: 0,
    };
  }

  const isFinalClosure = analyticsResults.some(s => s.isFinalClosure);
  const criticos = analyticsResults.filter(s => s.semaforo === 'red').length;
  const monitoreo = analyticsResults.filter(s => s.semaforo === 'yellow').length;
  const autonomos = analyticsResults.filter(s => s.semaforo === 'green').length;
  const dpiCount = analyticsResults.filter(s => s.isDpiCritical).length;

  const sumTareas = analyticsResults.reduce((acc, s) => acc + s.tareasAvg, 0);
  const promedioTareas = (sumTareas / total).toFixed(2);

  const sumFinal = analyticsResults.reduce((acc, s) => acc + (s.promedioFinal !== undefined ? s.promedioFinal : s.tareasAvg), 0);
  const promedioFinal = (sumFinal / total).toFixed(2);

  const aprobadosCount = analyticsResults.filter(s => {
    if (isFinalClosure) return s.condicionFinal === 'APROBADO';
    return s.tareasAvg >= 12 && !s.isDpiCritical;
  }).length;
  const desaprobadosCount = total - aprobadosCount;
  const aprobadosPct = Math.round((aprobadosCount / total) * 100);
  const desaprobadosPct = 100 - aprobadosPct;
  const retencionPct = Math.round(((total - criticos) / total) * 100);

  return {
    total,
    criticos,
    monitoreo,
    autonomos,
    dpiCount,
    promedioTareas,
    promedioFinal,
    retencionPct,
    aprobadosCount,
    desaprobadosCount,
    aprobadosPct,
    desaprobadosPct,
  };
}

export function calculateParetoData(analyticsResults = []) {
  if (!analyticsResults || analyticsResults.length === 0) {
    return { labels: ['Sin datos'], counts: [0], cumulativePercentages: [0] };
  }

  const isFinalClosure = analyticsResults.some(s => s.isFinalClosure);

  if (isFinalClosure) {

    const causesCount = {
      'Omitió tareas continuas': 0,
      'Inasistencia DPI (≥30%)': 0,
      'Cayó en Examen Final': 0,
      'Promedio insuficiente': 0,
    };

    analyticsResults.forEach(s => {
      if (s.causaCodigo === 'C-TAREAS') causesCount['Omitió tareas continuas']++;
      else if (s.causaCodigo === 'C-DPI') causesCount['Inasistencia DPI (≥30%)']++;
      else if (s.causaCodigo === 'C-FINAL') causesCount['Cayó en Examen Final']++;
      else if (s.causaCodigo === 'C-NOTAS') causesCount['Promedio insuficiente']++;
    });

    const sorted = Object.entries(causesCount)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return { labels: ['Sin reprobados (100% aprobado)'], counts: [0], cumulativePercentages: [0] };
    }

    const totalOccurrences = sorted.reduce((acc, [_, count]) => acc + count, 0);
    let runningSum = 0;

    const labels = [];
    const counts = [];
    const cumulativePercentages = [];

    sorted.forEach(([label, count]) => {
      labels.push(label);
      counts.push(count);
      runningSum += count;
      const pct = Math.round((runningSum / totalOccurrences) * 100);
      cumulativePercentages.push(pct);
    });

    return { labels, counts, cumulativePercentages };
  }

  const causesCount = {
    'Tareas Omitidas': 0,
    'Promedio Tareas < 12': 0,
    'Inasistencia DPI (≥30%)': 0,
    'Inasistencias Altas (<75%)': 0,
    'Baja Part. en Foros': 0,
    'Presencia Pasiva': 0,
  };

  analyticsResults.forEach(s => {
    if (s.tasksDeliveredCount < s.totalExpectedWeeks) {
      causesCount['Tareas Omitidas']++;
    }
    if (s.tareasAvg < 12.0) {
      causesCount['Promedio Tareas < 12']++;
    }
    if (s.isDpiCritical) {
      causesCount['Inasistencia DPI (≥30%)']++;
    }
    if (s.asistPct < 0.75) {
      causesCount['Inasistencias Altas (<75%)']++;
    }
    if (s.partAvg < 10.0) {
      causesCount['Baja Part. en Foros']++;
    }
    if (s.asistPct >= 0.80 && s.tareasAvg < 10.0) {
      causesCount['Presencia Pasiva']++;
    }
  });

  const sorted = Object.entries(causesCount)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return { labels: ['Sin factores de riesgo'], counts: [0], cumulativePercentages: [0] };
  }

  const totalOccurrences = sorted.reduce((acc, [_, count]) => acc + count, 0);
  let runningSum = 0;

  const labels = [];
  const counts = [];
  const cumulativePercentages = [];

  sorted.forEach(([label, count]) => {
    labels.push(label);
    counts.push(count);
    runningSum += count;
    const pct = Math.round((runningSum / totalOccurrences) * 100);
    cumulativePercentages.push(pct);
  });

  return { labels, counts, cumulativePercentages };
}

export function calculateHistogramData(analyticsResults = [], hasTasks = true) {
  if (!analyticsResults || analyticsResults.length === 0) {
    return {
      labels: ['0 - 5.9', '6 - 10.9', '11 - 11.9', '12 - 14.9', '15 - 20'],
      counts: [0, 0, 0, 0, 0],
      disapprovedCount: 0,
      approvedCount: 0,
    };
  }

  const isFinalClosure = analyticsResults.some(s => s.isFinalClosure);

  if (isFinalClosure) {

    const bins = [0, 0, 0, 0, 0];
    let disapprovedCount = 0;
    let approvedCount = 0;

    analyticsResults.forEach(s => {
      const grade = s.promedioFinal !== undefined ? s.promedioFinal : s.tareasAvg;
      if (s.isDpiCritical || grade < 6.0) {
        bins[0]++;
        disapprovedCount++;
      } else if (grade < 8.0) {
        bins[1]++;
        disapprovedCount++;
      } else if (grade < 12.0) {
        bins[2]++;
        disapprovedCount++;
      } else if (grade < 15.0) {
        bins[3]++;
        approvedCount++;
      } else {
        bins[4]++;
        approvedCount++;
      }
    });

    return {
      labels: ['[0 - 5.9] Repite', '[6 - 7.9] Repite', '[8 - 11.9] Subsanación', '[12 - 14.9] Aprobado', '[15 - 20] Destacado'],
      counts: bins,
      disapprovedCount,
      approvedCount,
    };
  }

  const bins = [0, 0, 0, 0, 0];
  let disapprovedCount = 0;
  let approvedCount = 0;

  analyticsResults.forEach(s => {
    const studentHasTasks = s.hasTasks !== undefined ? s.hasTasks : hasTasks;
    let grade = 0;
    if (studentHasTasks) {
      grade = s.tareasAvg;
    } else if (s.hasParticipation) {
      grade = s.partAvg;
    } else if (s.examsAvg !== null && s.examsAvg !== '—') {
      grade = Number(s.examsAvg);
    }
    if (grade < 6.0) {
      bins[0]++;
      disapprovedCount++;
    } else if (grade < 11.0) {
      bins[1]++;
      disapprovedCount++;
    } else if (grade < 12.0) {
      bins[2]++;
      disapprovedCount++;
    } else if (grade < 15.0) {
      bins[3]++;
      approvedCount++;
    } else {
      bins[4]++;
      approvedCount++;
    }
  });

  return {
    labels: ['[0 - 5.9] Crítico', '[6 - 10.9] Insuficiente', '[11 - 11.9] Límite', '[12 - 14.9] Regular', '[15 - 20] Destacado'],
    counts: bins,
    disapprovedCount,
    approvedCount,
  };
}

export function calculateSuggestedPa(student, hasParticipation = true, hasTasks = true) {
  let sumTareas = 0;
  let countTareas = 0;
  let sumForos = 0;
  let countForos = 0;

  REGULAR_WEEKS.forEach(w => {
    if (hasTasks) {
      const rawT = student[`tarea_s${w}`];
      if (rawT !== '' && rawT !== undefined && !isNaN(Number(rawT))) {
        sumTareas += Number(rawT);
        countTareas++;
      }
    }
    if (hasParticipation) {
      const rawF = student[`foro_s${w}`];
      if (rawF !== '' && rawF !== undefined && !isNaN(Number(rawF))) {
        sumForos += Number(rawF);
        countForos++;
      }
    }
  });

  const avgTareas = (hasTasks && countTareas > 0) ? (sumTareas / countTareas) : 0;
  const avgForos = (hasParticipation && countForos > 0) ? (sumForos / countForos) : 0;

  if (hasTasks && hasParticipation) {
    if (countTareas > 0 && countForos > 0) {
      return Math.round(((avgTareas * 0.5) + (avgForos * 0.5)) * 10) / 10;
    }
    if (countTareas > 0) return Math.round(avgTareas * 10) / 10;
    if (countForos > 0) return Math.round(avgForos * 10) / 10;
    return 0;
  }

  if (hasTasks && !hasParticipation) {
    return Math.round(avgTareas * 10) / 10;
  }

  if (!hasTasks && hasParticipation) {
    return Math.round(avgForos * 10) / 10;
  }

  return 0;
}
