import { sendSuccessRes } from '../utils/responseHandler.js';
import User from './../models/userModel.js';

import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const filterObj = (obj, ...allowedFileds) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFileds.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined. Please use SignUp instead!',
  });
};

//Do NOT update passwords with this!!
const updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password)
    throw new AppError('This path is not to be used to update password!!', 400);
  const doc = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  sendSuccessRes(res, { statusCode: 200, data: { doc } });
});
const getAllUsers = catchAsync(async (req, res, next) => {
  const doc = await User.find();
  sendSuccessRes(res, { statusCode: 200, data: { doc } });
});
const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('No such user exists!', 404);
  sendSuccessRes(res, { statusCode: 200, data: { user } });
});
const deleteUser = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  sendSuccessRes(res, { statusCode: 204 });
});

const updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword'
      ),
      400
    );
  }

  //Update user document
  const filteredBody = filterObj(req.body, 'username', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  sendSuccessRes(res, { statusCode: 200, data: { updatedUser } });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  sendSuccessRes(res, { statusCode: 204 });
});

export default {
  createUser,
  getAllUsers,
  getUser,
  deleteUser,
  deleteMe,
  updateMe,
  updateUser,
};
