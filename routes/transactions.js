const express = require('express');
const router  = express.Router();
const { getTransactions, completeTask } = require('../controllers/transactionController');

router.get('/',             getTransactions);
router.post('/complete',    completeTask);

module.exports = router;
