const express = require('express');
const router  = express.Router();
const { setSkills, getSkills } = require('../controllers/skillController');

router.post('/',          setSkills);
router.get('/:email',     getSkills);

module.exports = router;
