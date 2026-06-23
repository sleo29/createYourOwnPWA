import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'A username is required'],
      minlength: [3, 'Minimum required length for username is 3'],
      maxlength: [50, 'Maximum length for username is 50'],
    },
    password: {
      type: String,
      required: [true, 'A password is required'],
      minlength: [5, 'Minimum required length for username is 5'],
      maxlength: [50, 'Maximum length for username is 50'],
      validate: [validator.isStrongPassword, 'A strong password is required'],
      select: false,
    },
    email: {
      type: String,
      required: [true, 'An email is required'],
      unique: [true, 'This email already exists!'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
userSchema.pre('save', function () {
  if (this.isModified('password') || this.isNew)
    this.passwordChangedAt = Date.now() - 1000;
});

const User = mongoose.model('User', userSchema);

export default User;
