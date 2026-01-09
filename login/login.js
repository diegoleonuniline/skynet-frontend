document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    if (!usuario || !contrasena) {
      alert('Ingrese usuario y contraseña');
      return;
    }

    try {
      const resp = await fetch(
        'https://skynet-backend-a47423108e2a.herokuapp.com/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, contrasena })
        }
      );

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        alert(data.mensaje || 'Credenciales inválidas');
        return;
      }

      // Guardar sesión
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // Redirigir al dashboard
      window.location.href = '/dashboard/index.html';

    } catch (error) {
      console.error(error);
      alert('No se pudo conectar con el servidor');
    }
  });
});
