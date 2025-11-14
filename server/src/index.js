"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var mongoose_1 = require("mongoose");
var requests_1 = require("./routes/requests");
var producers_1 = require("./routes/producers");
var styrofoamTypes_1 = require("./routes/styrofoamTypes");
var prices_1 = require("./routes/prices");
var admin_1 = require("./routes/admin");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 5003;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Database connection
var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styrtoaction';
mongoose_1.default.connect(MONGODB_URI)
    .then(function () {
    console.log('Connected to MongoDB');
})
    .catch(function (error) {
    console.error('MongoDB connection error:', error);
});
// Routes
app.use('/api/requests', requests_1.default);
app.use('/api/producers', producers_1.default);
app.use('/api/styrofoam-types', styrofoamTypes_1.default);
app.use('/api/prices', prices_1.default);
app.use('/api/admin', admin_1.default);
// Health check
app.get('/api/health', function (req, res) {
    res.json({ status: 'OK' });
});
app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
