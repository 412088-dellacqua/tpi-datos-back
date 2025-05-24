const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

module.exports = function(io) {
  const router = express.Router();

  // Enviar un mensaje (crear)
  router.post('/', async (req, res) => {
    try {
      const { chatId, sender, text } = req.body;

      const nuevoMensaje = new Message({ chatId, sender, text });
      const guardado = await nuevoMensaje.save();

      // Hacer populate del sender para que el front lo reciba listo
      const mensajeCompleto = await guardado.populate('sender', 'username');

      // Actualizar lastMessage en el chat
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
          text,
          sender,
          timestamp: guardado.timestamp
        }
      });

      // Emitir evento Socket.IO a los clientes conectados
      io.emit('nuevo-mensaje', mensajeCompleto);

      res.status(201).json(mensajeCompleto);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      res.status(500).json({ error: 'Error al enviar mensaje' });
    }
  });

  // Obtener todos los mensajes de un chat por su chatId
  router.get('/:chatId', async (req, res) => {
    try {
      const { chatId } = req.params;

      // Validar que sea un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'chatId inválido' });
      }

      const mensajes = await Message.find({ chatId }).populate('sender', 'username');

      res.json(mensajes);
    } catch (err) {
      console.error('Error al obtener mensajes:', err);
      res.status(500).json({ error: 'Error al obtener mensajes' });
    }
  });

  return router;
};
