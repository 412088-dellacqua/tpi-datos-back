const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Enviar un mensaje (crear)
router.post('/', async (req, res) => {
  try {
    const { chatId, sender, text } = req.body;
    const nuevoMensaje = new Message({ chatId, sender, text });
    const guardado = await nuevoMensaje.save();

    // Actualizar lastMessage en el chat
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text,
        sender,
        timestamp: guardado.timestamp
      }
    });

    res.status(201).json(guardado);
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// Obtener todos los mensajes de un chat
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const mensajes = await Message.find({ chatId }).populate('sender', 'username');
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

module.exports = router;
