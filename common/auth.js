// common/auth.js
function guardarSesion(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
}

function obtenerToken() {
  return localStorage.getItem('token');
}

function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/login/';
}

function requiereSesion() {
  const token = obtenerToken();
  if (!token) {
    window.location.href = '/login/';
    return false;
  }
  return true;
}

window.AUTH = {
  guardarSesion,
  obtenerToken,
  obtenerUsuario,
  cerrarSesion,
  requiereSesion
};
