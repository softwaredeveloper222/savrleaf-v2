import mongoose from 'mongoose';
import { getCoordinatesFromAddress } from '../utils/geocode.js';

const { Schema, model } = mongoose;

const GenericDispensarySchema = new Schema(
  {
    name: { type: String, required: true },
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
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    licenseNumber: { type: String },
    websiteUrl: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    description: { type: String },
    amenities: { type: [String], default: [] },
  },
  { timestamps: true }
);

GenericDispensarySchema.index({ coordinates: '2dsphere' });
GenericDispensarySchema.index({ name: 1, 'address.city': 1, 'address.state': 1, 'address.zipCode': 1 });

GenericDispensarySchema.pre('save', async function (next) {
  if (this.isModified('address')) {
    const { street1, street2, city, state, zipCode } = this.address;
    const fullAddress = `${street1}${street2 ? ' ' + street2 : ''}, ${city}, ${state} ${zipCode}`;
    const coords = await getCoordinatesFromAddress(fullAddress);
    if (coords) {
      this.coordinates = { type: 'Point', coordinates: coords };
    }
  }
  next();
});

export default model('GenericDispensary', GenericDispensarySchema);
