import mongoose from 'mongoose';
import { getCoordinatesFromAddress } from '../utils/geocode.js';

const { Schema, model } = mongoose;

const LocationSchema = new Schema(
  {
    address: {
      street1: { type: String, required: true },
      street2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: {
        type: String,
        required: true,
        match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code'],
      },
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    type: {
      type: String,
      enum: ['main', 'additional'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

LocationSchema.pre('save', async function (next) {
  if (this.isModified('address')) {
    const { street1, street2, city, state, zipCode } = this.address;
    const fullAddress = `${street1}${street2 ? ' ' + street2 : ''}, ${city}, ${state} ${zipCode}`;
    const coords = await getCoordinatesFromAddress(fullAddress);
    if (coords) {
      this.coordinates = {
        type: 'Point',
        coordinates: coords,
      };
    }
  }
  next();
});

LocationSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.address) {
    const { street1, street2, city, state, zipCode } = update.address;
    const fullAddress = `${street1}${street2 ? ' ' + street2 : ''}, ${city}, ${state} ${zipCode}`;
    const coords = await getCoordinatesFromAddress(fullAddress);
    if (coords) {
      update.coordinates = {
        type: 'Point',
        coordinates: coords,
      };
    }
  }
  next();
});

export default model('Dispensary', DispensarySchema);
