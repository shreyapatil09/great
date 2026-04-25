const Application = require('../models/Application');
const Task        = require('../models/Task');
const Transaction = require('../models/Transaction');

// POST /apply
const applyForTask = async (req, res) => {
  try {
    const { taskId, studentEmail } = req.body;

    if (!taskId || !studentEmail) {
      return res.status(400).json({ error: 'taskId and studentEmail are required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (task.status !== 'available') {
      return res.status(400).json({ error: 'Task is not available for applications.' });
    }

    // Enforce one application per student per task
    const existing = await Application.findByTaskAndStudent(taskId, studentEmail);
    if (existing) {
      return res.status(409).json({ error: 'You have already applied for this task.' });
    }

    const id = await Application.create({ taskId, studentEmail });
    res.status(201).json({ message: 'Application submitted.', applicationId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply.', detail: err.message });
  }
};

// GET /applications/:taskId
const getApplicationsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const apps = await Application.getByTask(taskId);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications.', detail: err.message });
  }
};

// POST /applications/status  { taskId, studentEmail, status: 'accepted'|'rejected' }
const updateApplicationStatus = async (req, res) => {
  try {
    const { taskId, studentEmail, status } = req.body;

    if (!taskId || !studentEmail || !status) {
      return res.status(400).json({ error: 'taskId, studentEmail, and status are required.' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'." });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const application = await Application.findByTaskAndStudent(taskId, studentEmail);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await Application.updateStatus(taskId, studentEmail, status);

    if (status === 'accepted') {
      // Reject everyone else and move task to in-progress
      await Application.rejectOthers(taskId, studentEmail);
      await Task.updateStatus(taskId, 'in-progress');
    }

    res.json({ message: `Application ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application status.', detail: err.message });
  }
};

module.exports = { applyForTask, getApplicationsByTask, updateApplicationStatus };
