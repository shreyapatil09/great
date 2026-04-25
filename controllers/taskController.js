const Task = require('../models/Task');

// POST /tasks
const createTask = async (req, res) => {
  try {
    const { title, description, budget, clientEmail } = req.body;

    if (!title || !description || !clientEmail) {
      return res.status(400).json({ error: 'title, description, and clientEmail are required.' });
    }

    const id = await Task.create({ title, description, budget: budget || 0, clientEmail });
    res.status(201).json({ message: 'Task created.', taskId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.', detail: err.message });
  }
};

// GET /tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.getAll();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks.', detail: err.message });
  }
};

// GET /tasks/client/:email
const getTasksByClient = async (req, res) => {
  try {
    const { email } = req.params;
    const tasks = await Task.getByClient(decodeURIComponent(email));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client tasks.', detail: err.message });
  }
};

module.exports = { createTask, getAllTasks, getTasksByClient };
