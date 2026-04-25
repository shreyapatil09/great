const db = require('../config/db');

const Transaction = {
  async create({ taskId, clientEmail, studentEmail, amount }) {
    const [result] = await db.execute(
      'INSERT INTO transactions (taskId, clientEmail, studentEmail, amount) VALUES (?, ?, ?, ?)',
      [taskId, clientEmail, studentEmail, amount]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await db.execute(
      `SELECT t.*, tk.title AS taskTitle
       FROM transactions t
       LEFT JOIN tasks tk ON t.taskId = tk.id
       ORDER BY t.created_at DESC`
    );
    return rows;
  },

  async updateStatus(taskId, status) {
    const [result] = await db.execute(
      'UPDATE transactions SET status = ? WHERE taskId = ?',
      [status, taskId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Transaction;
