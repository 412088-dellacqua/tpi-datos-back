const express = require('express');
const Chat = require('../models/Chat');

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

  // Obtener todos los chats de un usuario
  router.get('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const chats = await Chat.find({ users: userId }).populate('users');
      // Emitir evento a todos los clientes conectados
      io.emit('nuevo-chat', chats);
      res.json(chats);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener los chats' });
    }
  });

  return router;
};
