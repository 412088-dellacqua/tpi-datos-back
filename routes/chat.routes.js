const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// Crear un nuevo chat
router.post('/', async (req, res) => {
  try {
    const { users } = req.body;
    const nuevoChat = new Chat({ users });
    const creado = await nuevoChat.save();
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
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

module.exports = router;
