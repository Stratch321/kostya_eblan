// ── Элементы DOM ──────────────────────────────────────────────────────────
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const btnSubmit   = document.getElementById('btn-submit');
const togglePw    = document.getElementById('toggle-pw');
const eyeIcon     = document.getElementById('eye-icon');
const fieldEmail  = document.getElementById('field-email');
const fieldPass   = document.getElementById('field-pass');
const emailErr    = document.getElementById('email-err');
const passErr     = document.getElementById('pass-err');
const globalErr   = document.getElementById('global-err');
const loginForm   = document.getElementById('login-form');
const successState = document.getElementById('success-state');
const successEmail = document.getElementById('success-email');
const btnLogout   = document.getElementById('btn-logout');

// ── Показать/скрыть пароль ────────────────────────────────────────────────
togglePw.addEventListener('click', () => {
  const show = passInput.type === 'password';
  passInput.type = show ? 'text' : 'password';
  eyeIcon.className = show ? 'ti ti-eye-off' : 'ti ti-eye';
  togglePw.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
});

// ── Сброс ошибок при вводе ────────────────────────────────────────────────
emailInput.addEventListener('input', () => {
  fieldEmail.classList.remove('has-error');
  emailErr.textContent = '';
  globalErr.textContent = '';
});

passInput.addEventListener('input', () => {
  fieldPass.classList.remove('has-error');
  passErr.textContent = '';
  globalErr.textContent = '';
});

// ── Отправка формы по Enter ───────────────────────────────────────────────
[emailInput, passInput].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') submitForm(); })
);

// ── Валидация на клиенте ─────────────────────────────────────────────────
function validateClient() {
  let valid = true;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailInput.value.trim() || !emailRe.test(emailInput.value.trim())) {
    fieldEmail.classList.add('has-error');
    emailErr.textContent = 'Введите корректный email';
    valid = false;
  }

  if (passInput.value.length < 6) {
    fieldPass.classList.add('has-error');
    passErr.textContent = 'Минимум 6 символов';
    valid = false;
  }

  return valid;
}

// ── Отправка запроса на сервер ────────────────────────────────────────────
async function submitForm() {
  if (!validateClient()) return;

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="ti ti-loader-2 ti-spin"></i> Вход...';
  globalErr.textContent = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    emailInput.value.trim(),
        password: passInput.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Серверная ошибка — показываем сообщение
      globalErr.textContent = data.error || 'Ошибка сервера';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="ti ti-arrow-right"></i> Войти';
      return;
    }

    // Успех — показываем экран приветствия
    loginForm.style.display = 'none';
    successState.style.display = 'block';
    successEmail.textContent = data.user.email;

  } catch {
    globalErr.textContent = 'Не удалось подключиться к серверу';
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="ti ti-arrow-right"></i> Войти';
  }
}

btnSubmit.addEventListener('click', submitForm);

// ── Выход ─────────────────────────────────────────────────────────────────
btnLogout.addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    successState.style.display = 'none';
    loginForm.style.display = 'block';
    emailInput.value = '';
    passInput.value  = '';
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="ti ti-arrow-right"></i> Войти';
  }
});
