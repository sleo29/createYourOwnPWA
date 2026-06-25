import { sendSuccessRes } from '../utils/responseHandler.js';
import User from './../models/userModel.js';
import jwt from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import bcrypt from 'bcryptjs';

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createTokenAndSendRes = (res, statusCode, user) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  sendSuccessRes(res, { statusCode, data: { token, user } });
};
const signup = catchAsync(async (req, res) => {
  if (
    !req.body.passwordConfirm ||
    req.body.passwordConfirm !== req.body.password
  )
    throw new Error('passwordConfirm missing or does not match');
  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    role: req.body.role,
  });
  createTokenAndSendRes(res, 200, user);
});
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new AppError('Email or password missing!', 400);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw new AppError('Invalid credentials, Please try again!', 401);
  createTokenAndSendRes(res, 200, user);
});
const forgotPassword = (req, res) => {};
const updateMyPassword = (req, res) => {};
const protect = (req, res) => {};

export default { signup, login, forgotPassword, updateMyPassword, protect };
