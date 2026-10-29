/**
 * INVENKRAFT - Client Login & Registration Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Jika sudah memiliki token aktif, cek dan arahkan langsung ke dashboard
  if (Storage.isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  const alertBox = document.getElementById('auth-alert');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  const btnDemoAdmin = document.getElementById('btn-demo-admin');
  const btnDemoStaff = document.getElementById('btn-demo-staff');

  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const toggleLoginPass = document.getElementById('toggle-login-pass');

  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const spinnerLogin = document.getElementById('spinner-login');

  const btnSubmitRegister = document.getElementById('btn-submit-register');
  const spinnerRegister = document.getElementById('spinner-register');

  // Cek parameter query sesi expired
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired') === 'true') {
    showAlert('Sesi Anda telah berakhir. Silakan masukkan kembali kredensial Anda.', 'error');
  }

  // Tampilkan Alert Pesan
  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `auth-alert auth-alert-${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  // Tab Switching
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('is-active');
    tabLogin.setAttribute('aria-selected', 'true');
    tabRegister.classList.remove('is-active');
    tabRegister.setAttribute('aria-selected', 'false');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
    hideAlert();
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('is-active');
    tabRegister.setAttribute('aria-selected', 'true');
    tabLogin.classList.remove('is-active');
    tabLogin.setAttribute('aria-selected', 'false');
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
    hideAlert();
  });

  // Demo Credentials Click
  btnDemoAdmin.addEventListener('click', () => {
    if (tabLogin.classList.contains('is-active') === false) {
      tabLogin.click();
    }
    loginUsername.value = 'admin';
    loginPassword.value = 'admin123';
    hideAlert();
    loginPassword.focus();
  });

  btnDemoStaff.addEventListener('click', () => {
    if (tabLogin.classList.contains('is-active') === false) {
      tabLogin.click();
    }
    loginUsername.value = 'staff';
    loginPassword.value = 'staff123';
    hideAlert();
    loginPassword.focus();
  });

  // Toggle Password Visibility
  toggleLoginPass.addEventListener('click', () => {
    const isPassword = loginPassword.type === 'password';
    loginPassword.type = isPassword ? 'text' : 'password';
    toggleLoginPass.textContent = isPassword ? 'SEMBUNYIKAN' : 'LIHAT';
    toggleLoginPass.setAttribute('aria-label', isPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi');
  });

  // Submit Handler: LOGIN
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    let hasError = false;
    const grpUser = document.getElementById('grp-login-username');
    const grpPass = document.getElementById('grp-login-password');

    if (!username) {
      grpUser.classList.add('has-error');
      hasError = true;
    } else {
      grpUser.classList.remove('has-error');
    }

    if (!password) {
      grpPass.classList.add('has-error');
      hasError = true;
    } else {
      grpPass.classList.remove('has-error');
    }

    if (hasError) return;

    // Loading State
    btnSubmitLogin.disabled = true;
    spinnerLogin.style.display = 'inline-block';
    btnSubmitLogin.querySelector('.btn-text').textContent = 'Memverifikasi...';

    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.success && response.data?.token) {
        // Simpan token & payload user
        Storage.setToken(response.data.token);
        Storage.setUser(response.data.user);

        showAlert('Autentikasi berhasil! Mengalihkan ke dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 500);
      } else {
        showAlert(response.message || 'Login gagal, periksa kembali username dan password.', 'error');
      }
    } catch (error) {
      showAlert(error.message || 'Gagal menghubungi server. Pastikan server backend sedang berjalan.', 'error');
    } finally {
      btnSubmitLogin.disabled = false;
      spinnerLogin.style.display = 'none';
      btnSubmitLogin.querySelector('.btn-text').textContent = 'Masuk ke Sistem';
    }
  });

  // Submit Handler: REGISTER
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const full_name = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    if (!full_name || !username || !email || !password) {
      showAlert('Harap isi semua bidang formulir pendaftaran.', 'error');
      return;
    }

    btnSubmitRegister.disabled = true;
    spinnerRegister.style.display = 'inline-block';
    btnSubmitRegister.querySelector('.btn-text').textContent = 'Mendaftarkan...';

    try {
      const response = await api.post('/auth/register', {
        full_name,
        username,
        email,
        password,
        role
      });

      if (response.success) {
        tabLogin.click();
        loginUsername.value = username;
        loginPassword.value = '';
        showAlert('Registrasi berhasil! Silakan masuk dengan kata sandi yang telah dibuat.', 'success');
      } else {
        showAlert(response.message || 'Gagal mendaftarkan akun.', 'error');
      }
    } catch (error) {
      showAlert(error.message || 'Terjadi kesalahan saat pendaftaran.', 'error');
    } finally {
      btnSubmitRegister.disabled = false;
      spinnerRegister.style.display = 'none';
      btnSubmitRegister.querySelector('.btn-text').textContent = 'Daftarkan Akun';
    }
  });
});
