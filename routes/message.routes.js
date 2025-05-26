const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

module.exports = function (io) {
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

  // GET /api/stats/top-palabras
  router.get('/stats/top-palabras', async (req, res) => {
    try {
      const resultado = await Message.aggregate([
        {
          $project: {
            words: { $split: ["$text", " "] }
          }
        },
        { $unwind: "$words" },
        {
          $group: {
            _id: "$words",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      res.json(resultado);
    } catch (err) {
      console.error('Error al obtener palabras más usadas:', err);
      res.status(500).json({ error: 'Error al obtener palabras más usadas' });
    }
  });


  // GET /api/stats/mensajes-por-usuario
  router.get('/stats/mensajes-por-usuario', async (req, res) => {
    try {
      const resultado = await Message.aggregate([
        {
          $group: {
            _id: "$sender",
            messageCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            username: "$user.username",
            email: "$user.email",
            messageCount: 1
          }
        },
        { $sort: { messageCount: -1 } }
      ]);

      res.json(resultado);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener mensajes por usuario' });
    }
  });


  // GET /api/stats/mensajes-por-fecha
  router.get('/stats/mensajes-por-fecha', async (req, res) => {
    try {
      const resultado = await Message.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            messageCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json(resultado);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener mensajes por fecha' });
    }
  });

  router.get('/stats/ranking-usuarios', async (req, res) => {
    try {
      const datos = await Message.aggregate([
        { $group: { _id: "$sender", totalMensajes: { $sum: 1 } } },
        {
          $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "usuario"
          }
        },
        { $unwind: "$usuario" },
        {
          $project: {
            _id: 0,
            username: "$usuario.username",
            totalMensajes: 1
          }
        },
        { $sort: { totalMensajes: -1 } }
      ]);
      res.json(datos);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener ranking de usuarios' });
    }
  });

router.get('/stats/chats-mas-activos', async (req, res) => {
  try {
    const datos = await Message.aggregate([
      {
        $group: {
          _id: "$chatId",
          totalMensajes: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "chats",
          localField: "_id",
          foreignField: "_id",
          as: "chat"
        }
      },
      { $unwind: "$chat" },
      {
        $lookup: {
          from: "users",
          localField: "chat.users",
          foreignField: "_id",
          as: "usuariosInfo"
        }
      },
      {
        $project: {
          _id: 0,
          chatId: "$_id",
          totalMensajes: 1,
          usuarios: {
            $map: {
              input: "$usuariosInfo",
              as: "usuario",
              in: "$$usuario.username"
            }
          }
        }
      },
      { $sort: { totalMensajes: -1 } },
      { $limit: 5 } 
    ]);

    res.json(datos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener chats más activos' });
  }
});



  router.get('/stats/evolucion-mensajes', async (req, res) => {
    try {
      const datos = await Message.aggregate([
        {
          $group: {
            _id: {
              fecha: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
              }
            },
            totalMensajes: { $sum: 1 }
          }
        },
        { $sort: { "_id.fecha": 1 } },
        {
          $project: {
            _id: 0,
            fecha: "$_id.fecha",
            totalMensajes: 1
          }
        }
      ]);
      res.json(datos);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener evolución diaria' });
    }
  });


  router.get('/stats/mensajes-por-dia-semana', async (req, res) => {
    try {
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const datos = await Message.aggregate([
        {
          $project: {
            diaSemana: { $dayOfWeek: "$timestamp" }
          }
        },
        {
          $group: {
            _id: "$diaSemana",
            totalMensajes: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      const datosConDias = datos.map(d => ({
        dia: dias[d._id - 1],
        totalMensajes: d.totalMensajes
      }));
      res.json(datosConDias);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener mensajes por día de la semana' });
    }
  });

  router.get('/stats/promedio-primer-mensaje', async (req, res) => {
    try {
      const datos = await Message.aggregate([
        {
          $project: {
            sender: 1,
            fecha: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            hora: { $hour: "$timestamp" }
          }
        },
        {
          $group: {
            _id: { sender: "$sender", fecha: "$fecha" },
            primerHora: { $min: "$hora" }
          }
        },
        {
          $group: {
            _id: "$_id.sender",
            promedioInicio: { $avg: "$primerHora" }
          }
        }
      ]);
      res.json(datos);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener promedio de hora del primer mensaje' });
    }
  });

  router.get('/stats/longitud-promedio-mensajes', async (req, res) => {
    try {
      const datos = await Message.aggregate([
        {
          $project: {
            sender: 1,
            longitud: { $strLenCP: "$text" }
          }
        },
        {
          $group: {
            _id: "$sender",
            promedioLongitud: { $avg: "$longitud" }
          }
        },
        { $sort: { promedioLongitud: -1 } }
      ]);
      res.json(datos);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuarios por longitud de mensajes' });
    }
  });

  router.get('/stats/ultimo-mensaje-usuario', async (req, res) => {
    try {
      const datos = await Message.aggregate([
        {
          $group: {
            _id: "$sender",
            ultimoMensaje: { $max: "$timestamp" }
          }
        },
        {
          $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "usuario"
          }
        },
        { $unwind: "$usuario" },
        {
          $project: {
            username: "$usuario.username",
            ultimoMensaje: 1
          }
        },
        { $sort: { ultimoMensaje: -1 } }
      ]);
      res.json(datos);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener último mensaje por usuario' });
    }
  });



  return router;
};
