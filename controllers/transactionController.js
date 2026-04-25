const Transaction = require('../models/Transaction');
const Task        = require('../models/Task');
const Application = require('../models/Application');

// GET /transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAll();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.', detail: err.message });
  }
};

// POST /transactions/complete  { taskId }
// Call this when a task is marked completed — creates the transaction entry
const completeTask = async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (task.status !== 'in-progress') {
      return res.status(400).json({ error: 'Task must be in-progress to complete.' });
    }

    // Find the accepted student
    const apps = await Application.getByTask(taskId);
    const accepted = apps.find(a => a.status === 'accepted');
    if (!accepted) {
      return res.status(400).json({ error: 'No accepted student found for this task.' });
    }

    // Mark task completed
    await Task.updateStatus(taskId, 'completed');

    // Create transaction record
    const txId = await Transaction.create({
      taskId,
      clientEmail:  task.clientEmail,
      studentEmail: accepted.studentEmail,
      amount:       task.budget,
    });

    res.json({ message: 'Task completed. Transaction created.', transactionId: txId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete task.', detail: err.message });
  }
};

module.exports = { getTransactions, completeTask };
