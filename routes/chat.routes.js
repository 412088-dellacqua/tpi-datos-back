const express = require('express');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');


module.exports = function(io) {
  const router = express.Router();

  // Crear un nuevo chat
  router.post('/', async (req, res) => {
    try {
      const { users } = req.body;
      const nuevoChat = new Chat({ users });
      const creado = await nuevoChat.save();

      // Emitir evento a todos los clientes conectados
      io.emit('nuevo-chat', creado);

      res.status(201).json(creado);
    } catch (err) {
      res.status(500).json({ error: 'Error al crear el chat' });
    }
  });

  // Obtener un chat por su chatId (ruta más específica)
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).populate('users');

    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    res.json(chat);
  } catch (err) {
    console.error('Error al obtener el chat por ID:', err);
    res.status(500).json({ error: 'Error al obtener el chat' });
  }
});

// Obtener todos los chats de un usuario, ordenados por último mensaje (más recientes primero)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);

    const chats = await Chat.find({ users: objectId })
      .populate('users')
      .sort({ 'lastMessage.timestamp': -1 }); // 👈 ordena por el timestamp del último mensaje

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

  return router;
};
