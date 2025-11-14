"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var GuidedItemSchema = new mongoose_1.Schema({
    useCase: {
        type: String,
        required: true,
    },
    styrofoamType: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'StyrofoamType',
    },
    styrofoamName: {
        type: String,
    },
    thicknessCm: {
        type: Number,
    },
    areaM2: {
        type: Number,
    },
    volumeM3: {
        type: Number,
    },
    notes: {
        type: String,
    },
}, { _id: false });
var RequestSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    company: {
        type: String,
    },
    postalCode: {
        type: String,
        required: true,
    },
    styrofoamType: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'StyrofoamType',
    },
    quantity: {
        type: Number,
    },
    requestMode: {
        type: String,
        enum: ['guided', 'manual'],
        default: 'guided',
    },
    guidedItems: {
        type: [GuidedItemSchema],
        default: undefined,
    },
    manualDetails: {
        type: String,
    },
    needsConsultation: {
        type: Boolean,
        default: false,
    },
    totalVolumeM3: {
        type: Number,
    },
    notes: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'sent'],
        default: 'pending',
    },
    emailSentAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('Request', RequestSchema);
