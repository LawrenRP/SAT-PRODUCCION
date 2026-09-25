export const STORAGE_KEY = 'utp_ews_courses_clean_v3';
export const PAGE_SIZE = 10;

export const PEDAGOGICAL_RULES = {
  MIN_PASSING_GRADE: 12.0,
  DPI_INASISTENCIA_PCT: 30.0,
  WEIGHT_HOMEWORK: 0.40,
  WEIGHT_ATTENDANCE: 0.20,
  WEIGHT_PARTICIPATION: 0.10,
  WEIGHT_PCS: 0.30,
};

export const REGULAR_WEEKS = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16];

export const EVALUATION_MILESTONES = [
  { key: 'pc1', label: 'PC1', fullLabel: 'Práctica Calificada 1 (Semana 5)', week: 5, weight: 0.20 },
  { key: 'pc2', label: 'PC2', fullLabel: 'Práctica Calificada 2 (Semana 10)', week: 10, weight: 0.20 },
  { key: 'pc3', label: 'PC3', fullLabel: 'Práctica Calificada 3 (Semana 15)', week: 15, weight: 0.20 },
  { key: 'pa',  label: 'PA',  fullLabel: 'Participación en Aula (Semana 17)', week: 17, weight: 0.10 },
  { key: 'pc4', label: 'PC4 / Final', fullLabel: 'Examen Final / PC4 (Semana 18)', week: 18, weight: 0.30 },
];

export const ACADEMIC_UNITS = [
  {
    id: 'u1',
    name: 'Unidad 1',
    shortName: 'U1',
    description: 'Unidad 1 (Semanas 1-5) · Diagnóstico & Alerta Temprana · Cierra con PC1',
    items: [
      { type: 'regular', week: '1', label: 'S1' },
      { type: 'regular', week: '2', label: 'S2' },
      { type: 'regular', week: '3', label: 'S3' },
      { type: 'regular', week: '4', label: 'S4 ★', badge: 'Alerta' },
      { type: 'exam', key: 'pc1', label: 'PC1', fullLabel: 'PC1 — Práctica Calificada 1 (Semana 5)' }
    ]
  },
  {
    id: 'u2',
    name: 'Unidad 2',
    shortName: 'U2',
    description: 'Unidad 2 (Semanas 6-10) · Consolidación Intermedia · Cierra con PC2',
    items: [
      { type: 'regular', week: '6', label: 'S6' },
      { type: 'regular', week: '7', label: 'S7' },
      { type: 'regular', week: '8', label: 'S8' },
      { type: 'regular', week: '9', label: 'S9' },
      { type: 'exam', key: 'pc2', label: 'PC2', fullLabel: 'PC2 — Práctica Calificada 2 (Semana 10)' }
    ]
  },
  {
    id: 'u3',
    name: 'Unidad 3',
    shortName: 'U3',
    description: 'Unidad 3 (Semanas 11-15) · Profundización Aplicada · Cierra con PC3',
    items: [
      { type: 'regular', week: '11', label: 'S11' },
      { type: 'regular', week: '12', label: 'S12' },
      { type: 'regular', week: '13', label: 'S13' },
      { type: 'regular', week: '14', label: 'S14' },
      { type: 'exam', key: 'pc3', label: 'PC3', fullLabel: 'PC3 — Práctica Calificada 3 (Semana 15)' }
    ]
  },
  {
    id: 'u4',
    name: 'Unidad 4',
    shortName: 'U4',
    description: 'Unidad 4 (Semanas 16-18) · Cierre de Semestre y Examen Final',
    items: [
      { type: 'regular', week: '16', label: 'S16' },
      { type: 'exam', key: 'pa', label: 'PA', fullLabel: 'PA — Participación en Aula (Semana 17)' },
      { type: 'exam', key: 'pc4', label: 'Final', fullLabel: 'PC4 / Examen Final (Semana 18)' }
    ]
  },
  {
    id: 'consolidado',
    name: 'Consolidado',
    shortName: 'Consolidado',
    description: 'Matriz consolidada de las 18 semanas del semestre',
    items: []
  }
];
