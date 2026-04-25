const db = require('../config/db');

const Skill = {
  // Replace all skills for a student (upsert pattern)
  async setForStudent(studentEmail, skillNames) {
    const conn = await require('../config/db').getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        'DELETE FROM skills WHERE studentEmail = ?',
        [studentEmail]
      );
      if (skillNames.length > 0) {
        const placeholders = skillNames.map(() => '(?, ?)').join(', ');
        const values = skillNames.flatMap(name => [studentEmail, name]);
        await conn.execute(
          `INSERT INTO skills (studentEmail, skillName) VALUES ${placeholders}`,
          values
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getByStudent(studentEmail) {
    const [rows] = await require('../config/db').execute(
      'SELECT skillName FROM skills WHERE studentEmail = ?',
      [studentEmail]
    );
    return rows.map(r => r.skillName);
  },
};

module.exports = Skill;
