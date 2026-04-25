const db = require('../config/db');

const Application = {
  async create({ taskId, studentEmail }) {
    const [result] = await db.execute(
      'INSERT INTO applications (taskId, studentEmail) VALUES (?, ?)',
      [taskId, studentEmail]
    );
    return result.insertId;
  },

  async getByTask(taskId) {
    const [rows] = await db.execute(
      'SELECT * FROM applications WHERE taskId = ? ORDER BY applied_at ASC',
      [taskId]
    );
    return rows;
  },

  async findByTaskAndStudent(taskId, studentEmail) {
    const [rows] = await db.execute(
      'SELECT * FROM applications WHERE taskId = ? AND studentEmail = ?',
      [taskId, studentEmail]
    );
    return rows[0] || null;
  },

  async updateStatus(taskId, studentEmail, status) {
    const [result] = await db.execute(
      'UPDATE applications SET status = ? WHERE taskId = ? AND studentEmail = ?',
      [status, taskId, studentEmail]
    );
    return result.affectedRows > 0;
  },

  // Reject all other applicants for a task
  async rejectOthers(taskId, acceptedEmail) {
    const [result] = await db.execute(
      "UPDATE applications SET status = 'rejected' WHERE taskId = ? AND studentEmail != ? AND status = 'pending'",
      [taskId, acceptedEmail]
    );
    return result.affectedRows;
  },
};

module.exports = Application;
