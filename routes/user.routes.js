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


// Endpoint para obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Excluye la password si existe
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error al buscar usuario por ID:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// GET buscar usuarios por username parcial
router.get('/buscar/:username', async (req, res) => {
  try {
    const regex = new RegExp(req.params.username, 'i');
    const usuarios = await User.find({ username: regex }).select('-password'); 
    res.json(usuarios);
  } catch (err) {
    console.error('Error al buscar usuarios:', err);
    res.status(500).json({ error: 'Error al buscar usuarios por username' });
  }
});


module.exports = router;
