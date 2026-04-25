const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /signup
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!['student', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or client.' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({ message: 'Account created successfully.', userId: id });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed.', detail: err.message });
  }
};

// POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.', detail: err.message });
  }
};

module.exports = { signup, login };
