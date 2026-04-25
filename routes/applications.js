const express = require('express');
const router  = express.Router();
const {
  applyForTask,
  getApplicationsByTask,
  updateApplicationStatus,
} = require('../controllers/applicationController');

router.post('/',             applyForTask);
router.get('/:taskId',       getApplicationsByTask);
router.post('/status',       updateApplicationStatus);

module.exports = router;
