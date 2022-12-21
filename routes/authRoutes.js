const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
//const cookieParser = require('cookie-parser');

//router.use(cookieParser);

router.route('/login').post(authController.login);
router.route('/signup').post(authController.signup);
router.route('/logout').get(authController.logout);
module.exports = router;
