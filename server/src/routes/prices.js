"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var Price_1 = require("../models/Price");
var router = express_1.default.Router();
// Get all prices
router.get('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, producer, styrofoamType, query, prices, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, producer = _a.producer, styrofoamType = _a.styrofoamType;
                query = {};
                if (producer)
                    query.producer = producer;
                if (styrofoamType)
                    query.styrofoamType = styrofoamType;
                // Only get active prices (validTo is null or in the future)
                query.$or = [
                    { validTo: null },
                    { validTo: { $gte: new Date() } }
                ];
                return [4 /*yield*/, Price_1.default.find(query)
                        .populate('producer')
                        .populate('styrofoamType')
                        .sort({ price: 1 })];
            case 1:
                prices = _b.sent();
                res.json(prices);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                res.status(500).json({ error: error_1.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get prices for a specific styrofoam type (for user requests)
router.get('/by-type/:styrofoamTypeId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var styrofoamTypeId, now, prices, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                styrofoamTypeId = req.params.styrofoamTypeId;
                now = new Date();
                return [4 /*yield*/, Price_1.default.find({
                        styrofoamType: styrofoamTypeId,
                        validFrom: { $lte: now },
                        $or: [
                            { validTo: null },
                            { validTo: { $gte: now } }
                        ],
                    })
                        .populate('producer')
                        .populate('styrofoamType')
                        .sort({ price: 1 })];
            case 1:
                prices = _a.sent();
                res.json(prices);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: error_2.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get single price
router.get('/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var price, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Price_1.default.findById(req.params.id)
                        .populate('producer')
                        .populate('styrofoamType')];
            case 1:
                price = _a.sent();
                if (!price) {
                    return [2 /*return*/, res.status(404).json({ error: 'Price not found' })];
                }
                res.json(price);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({ error: error_3.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create price
router.post('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, producer, styrofoamType, price, unit, currency, validFrom, validTo, notes, newPrice, savedPrice, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, producer = _a.producer, styrofoamType = _a.styrofoamType, price = _a.price, unit = _a.unit, currency = _a.currency, validFrom = _a.validFrom, validTo = _a.validTo, notes = _a.notes;
                if (!producer || !styrofoamType || price === undefined) {
                    return [2 /*return*/, res.status(400).json({ error: 'Producer, styrofoamType, and price are required' })];
                }
                newPrice = new Price_1.default({
                    producer: producer,
                    styrofoamType: styrofoamType,
                    price: price,
                    unit: unit || 'm2',
                    currency: currency || 'PLN',
                    validFrom: validFrom || new Date(),
                    validTo: validTo,
                    notes: notes,
                });
                return [4 /*yield*/, newPrice.save()];
            case 1:
                savedPrice = _b.sent();
                return [4 /*yield*/, savedPrice.populate('producer')];
            case 2:
                _b.sent();
                return [4 /*yield*/, savedPrice.populate('styrofoamType')];
            case 3:
                _b.sent();
                res.status(201).json(savedPrice);
                return [3 /*break*/, 5];
            case 4:
                error_4 = _b.sent();
                res.status(500).json({ error: error_4.message });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Update price
router.put('/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, producer, styrofoamType, price, unit, currency, validFrom, validTo, notes, updatedPrice, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, producer = _a.producer, styrofoamType = _a.styrofoamType, price = _a.price, unit = _a.unit, currency = _a.currency, validFrom = _a.validFrom, validTo = _a.validTo, notes = _a.notes;
                return [4 /*yield*/, Price_1.default.findByIdAndUpdate(req.params.id, { producer: producer, styrofoamType: styrofoamType, price: price, unit: unit, currency: currency, validFrom: validFrom, validTo: validTo, notes: notes }, { new: true, runValidators: true })
                        .populate('producer')
                        .populate('styrofoamType')];
            case 1:
                updatedPrice = _b.sent();
                if (!updatedPrice) {
                    return [2 /*return*/, res.status(404).json({ error: 'Price not found' })];
                }
                res.json(updatedPrice);
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                res.status(500).json({ error: error_5.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete price
router.delete('/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var price, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Price_1.default.findByIdAndDelete(req.params.id)];
            case 1:
                price = _a.sent();
                if (!price) {
                    return [2 /*return*/, res.status(404).json({ error: 'Price not found' })];
                }
                res.json({ message: 'Price deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res.status(500).json({ error: error_6.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
