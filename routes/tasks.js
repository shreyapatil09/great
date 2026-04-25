const express = require('express');
const router  = express.Router();
const { createTask, getAllTasks, getTasksByClient } = require('../controllers/taskController');

router.post('/',                  createTask);
router.get('/',                   getAllTasks);
router.get('/client/:email',      getTasksByClient);

module.exports = router;
