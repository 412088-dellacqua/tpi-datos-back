const express = require('express');
const cors = require('cors'); // 👈 importás cors
require('dotenv').config();
require('./db'); // Importa la conexión a la BD

const app = express();

// 👇 habilitás CORS para todas las rutas y orígenes
app.use(cors());

app.use(express.json());

// Rutas de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor de chat funcionando!');
});

// Ruta de usuarios (vacía por ahora)
app.use('/api/users', require('./routes/user.routes.js'));
app.use('/api/chats', require('./routes/chat.routes.js'));
app.use('/api/messages', require('./routes/message.routes.js'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
