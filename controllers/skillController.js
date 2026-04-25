const Skill = require('../models/Skill');

// POST /skills  { studentEmail, skills: ['HTML', 'CSS', ...] }
const setSkills = async (req, res) => {
  try {
    const { studentEmail, skills } = req.body;

    if (!studentEmail || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'studentEmail and skills (array) are required.' });
    }

    const cleaned = skills.map(s => String(s).trim()).filter(Boolean);
    await Skill.setForStudent(studentEmail, cleaned);

    res.json({ message: 'Skills updated.', skills: cleaned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skills.', detail: err.message });
  }
};

// GET /skills/:email
const getSkills = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const skills = await Skill.getByStudent(email);
    res.json({ studentEmail: email, skills });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skills.', detail: err.message });
  }
};

module.exports = { setSkills, getSkills };
