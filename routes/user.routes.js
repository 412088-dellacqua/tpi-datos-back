const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar si el usuario existe
    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const esValida = await bcrypt.compare(password, usuario.password);
    if (!esValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
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
