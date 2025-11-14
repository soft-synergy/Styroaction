"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var StyrofoamTypeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    thickness: {
        type: String,
    },
    density: {
        type: String,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('StyrofoamType', StyrofoamTypeSchema);
