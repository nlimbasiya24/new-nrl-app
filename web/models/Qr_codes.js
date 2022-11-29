import mongoose from "mongoose";
const { Schema } = mongoose; // in bulit schema have to import

const QrCode_Schema = new Schema({
  shopDomain: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true
  },
  variantId: {
    type: String,
    required: true,
  },
  handle: {
    type: String,
    required: true,
  },
  discountId: {
    type: String,
    
  },
  discountCode: {
    type: String,
    
  },
  destination: {
    type: String,
    required: true,
  },
  scans: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

export const qrcode_model= mongoose.model("qrcodes", QrCode_Schema);
