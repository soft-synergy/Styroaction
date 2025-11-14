"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var PriceSchema = new mongoose_1.Schema({
    producer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Producer',
        required: true,
    },
    styrofoamType: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'StyrofoamType',
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        default: 'm2',
    },
    currency: {
        type: String,
        default: 'PLN',
    },
    validFrom: {
        type: Date,
        default: Date.now,
    },
    validTo: {
        type: Date,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
// Index for efficient queries
PriceSchema.index({ producer: 1, styrofoamType: 1 });
exports.default = mongoose_1.default.model('Price', PriceSchema);
