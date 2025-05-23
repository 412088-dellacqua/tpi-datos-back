const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST crear usuario
router.post('/', async (req, res) => {
  try {
    const nuevoUsuario = new User(req.body);
    console.log(nuevoUsuario);
    const guardado = await nuevoUsuario.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// GET obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const usuarios = await User.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
