import { sendSuccessRes } from '../utils/responseHandler.js';
import User from './../models/userModel.js';
import jwt from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import bcrypt from 'bcryptjs';
import { promisify } from 'util';
import crypto from 'crypto';
import sendEmail from './../utils/email.js';

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
    throw new AppError('passwordConfirm missing or does not match', 400);
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

const protect = catchAsync(async (req, res, next) => {
  //Get the token and check if it exists
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  //Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    );
  //Check if user change password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!! Please log in again', 401)
    );
  }
  req.user = freshUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  //Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('There is no user with this email', 404));
  //Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //Send it to the user
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token (Valid for only 10 mins)`,
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //If token has not expired, and there is user, set hte new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  // Update changePasswordAt property of the user
  user.password = req.body.password;
  if (
    !req.body.passwordConfirm ||
    req.body.password !== req.body.passwordConfirm
  )
    throw new AppError(
      'password and passwordConfirm need to match!!, Please try again!',
      401
    );
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //Log the user in, send jwt
  createTokenAndSendRes(res, 200, user);
});

const updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //Check if current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Current password is incorrect', 401));
  }
  //If so, then update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  //Log the user in, send JWT
  createTokenAndSendRes(res, 200, user);
});

export default {
  signup,
  login,
  forgotPassword,
  restrictTo,
  protect,
  resetPassword,
  updatePassword,
};
