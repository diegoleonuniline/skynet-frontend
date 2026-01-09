const express = require('express');
const path = require('path');

const app = express();

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`🟢 Frontend Skynet activo en puerto ${PUERTO}`);
});
