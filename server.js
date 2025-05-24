const express = require('express');
const cors = require('cors');
const http = require('http'); // 👈 Necesitamos esto para crear el servidor HTTP
const { Server } = require('socket.io'); // 👈 Socket.IO
require('dotenv').config();
require('./db');

const app = express();
const server = http.createServer(app); // 👈 Express ahora usa este servidor
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // o el dominio de tu app Angular
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
  res.send('¡Servidor de chat funcionando con Socket.IO!');
});

app.use('/api/users', require('./routes/user.routes.js'));
const chatRoutes = require('./routes/chat.routes')(io);
app.use('/api/chats', chatRoutes);
const messageRoute = require('./routes/message.routes.js')(io);
app.use('/api/messages', messageRoute);

// Escuchando eventos de Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  socket.on('mensaje', (data) => {
    console.log('💬 Mensaje recibido:', data);
    io.emit('mensaje', data); // retransmitir a todos
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
