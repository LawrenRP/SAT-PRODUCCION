import { ApiService } from '../services/apiService.js';
import { showToast, showConfirmModal } from './notifications.js';
import { AppState, saveStateToStorage } from '../state.js';

export function setupAuthUI(callbacks = {}) {
  const { onLoginSuccess, onLogout } = callbacks;

  const btnOpenLogin = document.getElementById('btn-open-login');
  const userLoggedBox = document.getElementById('user-logged-box');
  const userDisplayName = document.getElementById('user-display-name');
  const userAvatarInitials = document.getElementById('user-avatar-initials');
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const btnLogout = document.getElementById('btn-logout');

  const modalAuth = document.getElementById('modal-auth');
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  const modalProfile = document.getElementById('modal-profile');
  const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');

  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  const updateAuthHeader = (user) => {
    if (user) {
      if (btnOpenLogin) btnOpenLogin.classList.add('hidden');
      if (userLoggedBox) userLoggedBox.classList.remove('hidden');
      if (userDisplayName) userDisplayName.textContent = user.nombre_completo || user.email;
      if (userAvatarInitials) {
        const initials = (user.nombre_completo || 'D')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map(w => w[0].toUpperCase())
          .join('');
        userAvatarInitials.textContent = initials || 'D';
      }
    } else {
      if (btnOpenLogin) btnOpenLogin.classList.remove('hidden');
      if (userLoggedBox) userLoggedBox.classList.add('hidden');
    }
  };

  const currentUser = ApiService.getCurrentUser();
  updateAuthHeader(currentUser);

  window.addEventListener('ews:auth-expired', () => {
    updateAuthHeader(null);
    showToast('Tu sesión ha expirado. Por favor, ingresa nuevamente.', 'warning');
  });

  const gateTabLogin = document.getElementById('gate-tab-login');
  const gateTabRegister = document.getElementById('gate-tab-register');
  const gateFormLogin = document.getElementById('gate-form-login');
  const gateFormRegister = document.getElementById('gate-form-register');

  function switchGateTab(target) {
    if (target === 'login') {
      if (gateTabLogin) {
        gateTabLogin.classList.add('bg-white', 'text-slate-900', 'shadow-2xs');
        gateTabLogin.classList.remove('text-slate-500');
      }
      if (gateTabRegister) {
        gateTabRegister.classList.remove('bg-white', 'text-slate-900', 'shadow-2xs');
        gateTabRegister.classList.add('text-slate-500');
      }
      if (gateFormLogin) gateFormLogin.classList.remove('hidden');
      if (gateFormRegister) gateFormRegister.classList.add('hidden');
      const inputEmail = document.getElementById('gate-login-email');
      if (inputEmail) inputEmail.focus();
    } else {
      if (gateTabRegister) {
        gateTabRegister.classList.add('bg-white', 'text-slate-900', 'shadow-2xs');
        gateTabRegister.classList.remove('text-slate-500');
      }
      if (gateTabLogin) {
        gateTabLogin.classList.remove('bg-white', 'text-slate-900', 'shadow-2xs');
        gateTabLogin.classList.add('text-slate-500');
      }
      if (gateFormRegister) gateFormRegister.classList.remove('hidden');
      if (gateFormLogin) gateFormLogin.classList.add('hidden');
      const inputNombre = document.getElementById('gate-reg-nombre');
      if (inputNombre) inputNombre.focus();
    }
  }

  if (gateTabLogin) gateTabLogin.addEventListener('click', () => switchGateTab('login'));
  if (gateTabRegister) gateTabRegister.addEventListener('click', () => switchGateTab('register'));

  if (gateFormLogin) {
    gateFormLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('gate-login-email').value.trim();
      const password = document.getElementById('gate-login-password').value;
      const btnSubmit = document.getElementById('gate-btn-submit-login');

      if (!email || !password) {
        showToast('Ingresa tu correo y contraseña.', 'warning');
        return;
      }

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Verificando credenciales...`;

        const docente = await ApiService.login(email, password);
        updateAuthHeader(docente);
        showToast(`¡Bienvenido(a), ${docente.nombre_completo}!`, 'success');

        if (onLoginSuccess) await onLoginSuccess(docente);
      } catch (err) {
        showToast(err.message || 'Error al iniciar sesión.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[17px]">login</span><span>Ingresar al Sistema</span>`;
      }
    });
  }

  if (gateFormRegister) {
    gateFormRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('gate-reg-nombre').value.trim();
      const email = document.getElementById('gate-reg-email').value.trim();
      const password = document.getElementById('gate-reg-password').value;
      const btnSubmit = document.getElementById('gate-btn-submit-register');

      if (!nombre || !email || !password) {
        showToast('Por favor completa tu nombre, correo y contraseña.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
        return;
      }

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Creando cuenta docente...`;

        const docente = await ApiService.register(nombre, email, password, "Universidad Tecnológica del Perú", "Docente UTP");
        updateAuthHeader(docente);
        showToast(`Cuenta docente creada con éxito. ¡Bienvenido(a), ${docente.nombre_completo}!`, 'success');

        if (onLoginSuccess) await onLoginSuccess(docente);
      } catch (err) {
        showToast(err.message || 'Error al registrar cuenta.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[17px]">person_add</span><span>Registrar Cuenta y Entrar</span>`;
      }
    });
  }

  if (btnOpenLogin && modalAuth) {
    btnOpenLogin.addEventListener('click', () => {
      modalAuth.classList.remove('hidden');
      switchAuthTab('login');
    });
  }

  if (btnCloseAuthModal && modalAuth) {
    btnCloseAuthModal.addEventListener('click', () => modalAuth.classList.add('hidden'));
  }

  function switchAuthTab(target) {
    if (target === 'login') {
      tabLogin.classList.add('border-[#CC142E]', 'text-[#CC142E]', 'font-bold');
      tabLogin.classList.remove('border-transparent', 'text-slate-500');
      tabRegister.classList.remove('border-[#CC142E]', 'text-[#CC142E]', 'font-bold');
      tabRegister.classList.add('border-transparent', 'text-slate-500');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
      document.getElementById('input-login-email').focus();
    } else {
      tabRegister.classList.add('border-[#CC142E]', 'text-[#CC142E]', 'font-bold');
      tabRegister.classList.remove('border-transparent', 'text-slate-500');
      tabLogin.classList.remove('border-[#CC142E]', 'text-[#CC142E]', 'font-bold');
      tabLogin.classList.add('border-transparent', 'text-slate-500');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
      document.getElementById('input-reg-nombre').focus();
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchAuthTab('register'));

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('input-login-email').value.trim();
      const password = document.getElementById('input-login-password').value;
      const btnSubmit = document.getElementById('btn-submit-login');

      if (!email || !password) {
        showToast('Ingresa tu correo y contraseña.', 'warning');
        return;
      }

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Verificando...`;

        const docente = await ApiService.login(email, password);
        updateAuthHeader(docente);
        modalAuth.classList.add('hidden');
        showToast(`¡Bienvenido(a), ${docente.nombre_completo}!`, 'success');

        if (onLoginSuccess) await onLoginSuccess(docente);
      } catch (err) {
        showToast(err.message || 'Error al iniciar sesión.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `Iniciar Sesión`;
      }
    });
  }

  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('input-reg-nombre').value.trim();
      const email = document.getElementById('input-reg-email').value.trim();
      const password = document.getElementById('input-reg-password').value;
      const btnSubmit = document.getElementById('btn-submit-register');

      if (!nombre || !email || !password) {
        showToast('Completa tu nombre, correo y contraseña.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
        return;
      }

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Registrando...`;

        const docente = await ApiService.register(nombre, email, password, "Universidad Tecnológica del Perú", "Docente UTP");
        updateAuthHeader(docente);
        modalAuth.classList.add('hidden');
        showToast(`Cuenta docente creada con éxito. ¡Bienvenido(a), ${docente.nombre_completo}!`, 'success');

        if (onLoginSuccess) await onLoginSuccess(docente);
      } catch (err) {
        showToast(err.message || 'Error al crear cuenta.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `Crear Cuenta e Ingresar`;
      }
    });
  }

  if (btnOpenProfile && modalProfile) {
    btnOpenProfile.addEventListener('click', () => {
      const user = ApiService.getCurrentUser();
      if (!user) return;

      document.getElementById('profile-email').value = user.email || '';
      document.getElementById('profile-nombre').value = user.nombre_completo || '';
      document.getElementById('profile-pwd-actual').value = '';
      document.getElementById('profile-pwd-nuevo').value = '';

      modalProfile.classList.remove('hidden');
    });
  }

  if (btnCloseProfileModal && modalProfile) {
    btnCloseProfileModal.addEventListener('click', () => modalProfile.classList.add('hidden'));
  }

  const formProfile = document.getElementById('form-profile');
  if (formProfile) {
    formProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('profile-nombre').value.trim();
      const pwdActual = document.getElementById('profile-pwd-actual').value;
      const pwdNuevo = document.getElementById('profile-pwd-nuevo').value;
      const btnSave = document.getElementById('btn-save-profile');

      const payload = {
        nombre_completo: nombre
      };

      if (pwdNuevo) {
        if (!pwdActual) {
          showToast('Ingresa tu contraseña actual para cambiarla.', 'warning');
          return;
        }
        if (pwdNuevo.length < 6) {
          showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
          return;
        }
        payload.password_actual = pwdActual;
        payload.password_nuevo = pwdNuevo;
      }

      try {
        btnSave.disabled = true;
        btnSave.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Guardando...`;

        const updated = await ApiService.updateProfile(payload);
        updateAuthHeader(updated);
        modalProfile.classList.add('hidden');
        showToast('Perfil actualizado correctamente.', 'success');
      } catch (err) {
        showToast(err.message || 'Error al actualizar perfil.', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = `Guardar Cambios`;
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: '¿Cerrar Sesión?',
        message: '¿Estás seguro de cerrar tu sesión de docente?',
        confirmText: 'Cerrar Sesión',
        cancelText: 'Continuar trabajando',
        isDanger: false
      });

      if (confirmed) {
        ApiService.clearSession();
        updateAuthHeader(null);
        showToast('Sesión cerrada correctamente.', 'info');
        if (onLogout) onLogout();
      }
    });
  }

  return {
    updateAuthHeader
  };
}
