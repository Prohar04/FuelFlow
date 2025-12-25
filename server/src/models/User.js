import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'cashier', 'employee'],
      required: [true, 'Role is required'],
    },
    jobTitle: {
      type: String,
      trim: true,
      // For employee subtype: 'fuel_boy', 'security_guard', or free text
    },
    salary: {
      type: Number,
      default: 0,
      min: 0,
      // Base salary for payroll calculation
    },
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      // null for admin, required for all other roles
      required: function () {
        return this.role !== 'admin';
      },
    },
    status: {
      type: String,
      enum: ['active', 'terminated'],
      default: 'active',
    },
    employmentHistory: [
      {
        role: String,
        jobTitle: String,
        pumpId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Pump',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
    preferences: {
      language: {
        type: String,
        enum: ['en', 'bn'],
        default: 'en',
      },
      theme: {
        type: String,
        enum: ['system', 'dark', 'light'],
        default: 'system',
      },
    },
    // Password reset fields
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
    },
    lastPasswordChangeAt: {
      type: Date,
    },
    terminationDate: {
      type: Date,
    },
    terminationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to generate password reset token
userSchema.methods.generateResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.resetPasswordTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiry (1 hour from now)
  this.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

// Add employment history entry
userSchema.methods.addEmploymentHistory = function (role, jobTitle, pumpId, reason) {
  this.employmentHistory.push({
    role,
    jobTitle,
    pumpId,
    reason,
    changedAt: new Date(),
  });
};

const User = mongoose.model('User', userSchema);

export default User;
