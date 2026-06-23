import express from 'express';
import userController from '../controllers/userController.js';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);

router.route('/').get(userController.getAllUsers);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updateMyPassword
);

export default router;
