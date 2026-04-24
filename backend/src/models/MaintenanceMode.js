import mongoose from 'mongoose';

/**
 * ADMIN ONLY - Maintenance Mode Model
 * Stores the maintenance mode state (ON/OFF)
 * NOT PARTNER FACING - Partners cannot access this
 */
const maintenanceModeSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    message: {
      type: String,
      default: 'We are currently performing maintenance. Please check back soon.',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

// Ensure only one document exists
maintenanceModeSchema.statics.getMaintenanceMode = async function () {
  let mode = await this.findOne();
  if (!mode) {
    mode = await this.create({ isEnabled: false });
  }
  return mode;
};

maintenanceModeSchema.statics.setMaintenanceMode = async function (isEnabled, userId, message) {
  let mode = await this.findOne();
  if (!mode) {
    mode = await this.create({ isEnabled, updatedBy: userId, message });
  } else {
    mode.isEnabled = isEnabled;
    mode.updatedBy = userId;
    if (message) {
      mode.message = message;
    }
    await mode.save();
  }
  return mode;
};

const MaintenanceMode = mongoose.models.MaintenanceMode || mongoose.model('MaintenanceMode', maintenanceModeSchema);

export default MaintenanceMode;

