const db = require('../config/db');

const Task = {
  async create({ title, description, budget, clientEmail }) {
    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, budget, clientEmail) VALUES (?, ?, ?, ?)',
      [title, description, budget, clientEmail]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await db.execute(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    return rows;
  },

  async getByClient(clientEmail) {
    const [rows] = await db.execute(
      'SELECT * FROM tasks WHERE clientEmail = ? ORDER BY created_at DESC',
      [clientEmail]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Task;
