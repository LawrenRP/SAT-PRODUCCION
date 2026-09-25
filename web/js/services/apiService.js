const API_BASE_URL = (window.location.port === '5500' || window.location.port === '3000')
  ? 'http://127.0.0.1:8000/api'
  : '/api';

const TOKEN_KEY = 'utp_ews_jwt_token';
const USER_KEY = 'utp_ews_current_user';

export const ApiService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (res.status === 401) {
        this.clearSession();
        window.dispatchEvent(new CustomEvent('ews:auth-expired'));
        throw new Error('Su sesión ha expirado o las credenciales no son válidas.');
      }

      if (res.status === 204) {
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error en la petición al servidor.');
      }

      return data;
    } catch (err) {
      console.warn(`[API] Error en ${endpoint}:`, err.message);
      throw err;
    }
  },

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setSession(data.access_token, data.docente);
    return data.docente;
  },

  async register(nombre_completo, email, password, institucion, especialidad) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre_completo,
        email,
        password,
        institucion,
        especialidad
      })
    });
    this.setSession(data.access_token, data.docente);
    return data.docente;
  },

  async getMe() {
    if (!this.isAuthenticated()) return null;
    const docente = await this.request('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(docente));
    return docente;
  },

  async updateProfile(profileData) {
    const updated = await this.request('/docente/perfil', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  async getCourses() {
    return await this.request('/cursos');
  },

  async createCourse(curso) {
    return await this.request('/cursos', {
      method: 'POST',
      body: JSON.stringify({
        codigo_seccion: curso.section || curso.id,
        nombre_curso: curso.name || curso.nombre || 'Curso sin nombre',
        periodo: curso.periodo || '2026-2',
        sesiones_semana: curso.sessionsPerWeek || curso.sesionesSemana || 2,
        tiene_participacion: curso.hasParticipation !== false,
        tiene_tareas: curso.hasTasks !== false,
        semana_corte: curso.semanaCorte || 4,
        datos_alumnos: curso.students || curso.alumnos || []
      })
    });
  },

  async updateCourse(backendId, curso) {
    return await this.request(`/cursos/${backendId}`, {
      method: 'PUT',
      body: JSON.stringify({
        codigo_seccion: curso.section || curso.id,
        nombre_curso: curso.name || curso.nombre || 'Curso sin nombre',
        periodo: curso.periodo || '2026-2',
        sesiones_semana: curso.sessionsPerWeek || curso.sesionesSemana || 2,
        tiene_participacion: curso.hasParticipation !== false,
        tiene_tareas: curso.hasTasks !== false,
        semana_corte: curso.semanaCorte || 4,
        datos_alumnos: curso.students || curso.alumnos || []
      })
    });
  },

  async deleteCourse(backendId) {
    return await this.request(`/cursos/${backendId}`, {
      method: 'DELETE'
    });
  }
};
