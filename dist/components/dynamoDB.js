// ================================================================
// ====================== DynamoDB Functions ======================
// ================================================================
import { __assign, __awaiter, __generator, __spreadArray } from "tslib";
// lib
import { encode, decode } from 'js-base64';
// ================================================= Basic Functions
// Query
var dynamodbQuery = function (db, params) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.query(params).promise()];
            case 1:
                results = _a.sent();
                return [2 /*return*/, results];
        }
    });
}); };
// Scan
var dynamodbScan = function (db, params) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.scan(params).promise()];
            case 1:
                results = _a.sent();
                return [2 /*return*/, results];
        }
    });
}); };
// Delete
var dynamodbDelete = function (db, params) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.delete(params).promise()];
            case 1:
                results = _a.sent();
                return [2 /*return*/, results];
        }
    });
}); };
// Update
var dynamodbUpdate = function (db, params) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.update(params).promise()];
            case 1:
                results = _a.sent();
                return [2 /*return*/, results];
        }
    });
}); };
// Put
var dynamodbPut = function (db, params) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.put(params).promise()];
            case 1:
                results = _a.sent();
                return [2 /*return*/, results];
        }
    });
}); };
// =========================================== Complicated Functions
// Batch Get
var dynamodbBatchGetItems = function (db, TableName, pkName, pkVal, skName, skValIDs) { return __awaiter(void 0, void 0, void 0, function () {
    var keyID, params, batchGet, batchRes, results;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                keyID = skValIDs.map(function (_ele) {
                    var _a, _b;
                    if (pkName && pkVal)
                        return _a = {}, _a[pkName] = pkVal, _a[skName] = _ele, _a;
                    else
                        return _b = {}, _b[skName] = _ele, _b;
                });
                params = { RequestItems: (_a = {}, _a[TableName] = { Keys: keyID }, _a) };
                return [4 /*yield*/, db.batchGet(params).promise()];
            case 1:
                batchGet = _b.sent();
                batchRes = batchGet.Responses;
                results = batchRes[TableName];
                // Return
                return [2 /*return*/, results];
        }
    });
}); };
// Get
var getSingleItem = function (db_1, TableName_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([db_1, TableName_1], args_1, true), void 0, function (db, TableName, IndexName, partitionKeyName, partitionKeyValue, sortKeyName, sortKeyValue) {
        var KeyConditionExpression, ExpressionAttributeValues, params, get, results;
        var _a;
        if (IndexName === void 0) { IndexName = null; }
        if (sortKeyName === void 0) { sortKeyName = null; }
        if (sortKeyValue === void 0) { sortKeyValue = null; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    KeyConditionExpression = "".concat(partitionKeyName, " = :").concat(partitionKeyName);
                    ExpressionAttributeValues = (_a = {},
                        _a[":".concat(partitionKeyName)] = partitionKeyValue,
                        _a);
                    if (sortKeyName && sortKeyValue) {
                        KeyConditionExpression + "AND ".concat(sortKeyName, " = :").concat(sortKeyName);
                        ExpressionAttributeValues[":".concat(sortKeyName)] = sortKeyValue;
                    }
                    params = {
                        TableName: TableName,
                        KeyConditionExpression: KeyConditionExpression,
                        ExpressionAttributeValues: ExpressionAttributeValues,
                    };
                    if (IndexName)
                        params['IndexName'] = IndexName;
                    return [4 /*yield*/, dynamodbQuery(db, params)];
                case 1:
                    get = (_b.sent());
                    results = get.Items[0];
                    return [2 /*return*/, results];
            }
        });
    });
};
// Get Multiple
var getMultipleItems = function (dynamoDb_1, TableName_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([dynamoDb_1, TableName_1], args_1, true), void 0, function (dynamoDb, TableName, IndexName, nextToken, pageSize, partitionKeyName, partitionKeyValue, sortKeyName, sortKeyValue, sortKeyCondition, // Case BETWEEN not Cover in this function
    filterExpression, scanIndexForward) {
        var dataList, ExclusiveStartKey, params, i, tempFilterExpression, key, filterKey, filterCon, filterVal, res, newParams, _nextToken;
        var _a, _b;
        if (IndexName === void 0) { IndexName = null; }
        if (sortKeyName === void 0) { sortKeyName = null; }
        if (sortKeyValue === void 0) { sortKeyValue = null; }
        if (sortKeyCondition === void 0) { sortKeyCondition = null; }
        if (filterExpression === void 0) { filterExpression = null; }
        if (scanIndexForward === void 0) { scanIndexForward = true; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    dataList = [];
                    ExclusiveStartKey = null;
                    if (nextToken) {
                        ExclusiveStartKey = decode(nextToken);
                        ExclusiveStartKey = JSON.parse(ExclusiveStartKey);
                    }
                    params = {
                        TableName: TableName,
                        Limit: pageSize,
                        KeyConditionExpression: "#".concat(partitionKeyName, " = :").concat(partitionKeyName),
                        ExpressionAttributeNames: (_a = {},
                            _a["#".concat(partitionKeyName)] = "".concat(partitionKeyName),
                            _a),
                        ExpressionAttributeValues: (_b = {},
                            _b[":".concat(partitionKeyName)] = partitionKeyValue,
                            _b),
                        ExclusiveStartKey: ExclusiveStartKey,
                    };
                    if (IndexName)
                        params['IndexName'] = IndexName;
                    if (scanIndexForward)
                        params['ScanIndexForward'] = scanIndexForward;
                    if (sortKeyValue) {
                        if (sortKeyCondition === 'begins_with' || sortKeyCondition === 'contains') {
                            params.KeyConditionExpression = "#".concat(partitionKeyName, " = :").concat(partitionKeyName, " AND ").concat(sortKeyCondition, "(#").concat(sortKeyName, ", :").concat(sortKeyName, ")");
                        }
                        else {
                            params.KeyConditionExpression = "#".concat(partitionKeyName, " = :").concat(partitionKeyName, " AND #").concat(sortKeyName, " ").concat(sortKeyCondition, " :").concat(sortKeyName);
                        }
                        params.ExpressionAttributeNames["#".concat(sortKeyName)] = "".concat(sortKeyName);
                        params.ExpressionAttributeValues[":".concat(sortKeyName)] = sortKeyValue;
                    }
                    i = 0;
                    if (typeof filterExpression === 'object') {
                        for (key in filterExpression) {
                            filterKey = key;
                            filterCon = filterExpression[filterKey].condition;
                            filterVal = filterExpression[filterKey].value;
                            if (filterKey && filterVal) {
                                i++;
                                if (filterCon === 'begins_with' || filterCon === 'contains') {
                                    if (i === 1)
                                        tempFilterExpression = "".concat(filterCon, "(#").concat(filterKey, ", :").concat(filterKey, ")");
                                    if (i > 1)
                                        tempFilterExpression = tempFilterExpression + " AND ".concat(filterCon, "(#").concat(filterKey, ", :").concat(filterKey, ")");
                                }
                                //
                                else {
                                    if (i === 1)
                                        tempFilterExpression = "#".concat(filterKey, " ").concat(filterCon, " :").concat(filterKey);
                                    if (i > 1)
                                        tempFilterExpression = tempFilterExpression + " AND #".concat(filterKey, " ").concat(filterCon, " :").concat(filterKey);
                                }
                                params.ExpressionAttributeNames["#".concat(filterKey)] = "".concat(filterKey);
                                params.ExpressionAttributeValues[":".concat(filterKey)] = filterVal;
                            }
                        }
                        params['FilterExpression'] = tempFilterExpression;
                    }
                    if (!IndexName)
                        delete params.IndexName;
                    return [4 /*yield*/, dynamodbQuery(dynamoDb, params)];
                case 1:
                    res = _c.sent();
                    dataList.push.apply(dataList, res.Items);
                    _c.label = 2;
                case 2:
                    if (!(dataList.length < pageSize && Object.prototype.hasOwnProperty.call(res, 'LastEvaluatedKey'))) return [3 /*break*/, 4];
                    newParams = __assign(__assign({}, params), { ExclusiveStartKey: res.LastEvaluatedKey });
                    return [4 /*yield*/, dynamodbQuery(dynamoDb, newParams)];
                case 3:
                    res = _c.sent();
                    dataList.push.apply(dataList, res.Items);
                    return [3 /*break*/, 2];
                case 4:
                    _nextToken = null;
                    if (res === null || res === void 0 ? void 0 : res.LastEvaluatedKey) {
                        _nextToken = encode(JSON.stringify(res.LastEvaluatedKey));
                    }
                    return [2 /*return*/, { items: dataList, newNextToken: _nextToken }];
            }
        });
    });
};
// Scan Multiple
var scanMultipleItems = function (dynamoDb_1, TableName_1, nextToken_1, pageSize_1) {
    var args_1 = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        args_1[_i - 4] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([dynamoDb_1, TableName_1, nextToken_1, pageSize_1], args_1, true), void 0, function (dynamoDb, TableName, nextToken, pageSize, filterExpression) {
        var dataList, ExclusiveStartKey, params, i, tempFilterExpression, key, filterKey, filterCon, filterVal, res, newParams, _nextToken;
        if (filterExpression === void 0) { filterExpression = null; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataList = [];
                    ExclusiveStartKey = null;
                    if (nextToken) {
                        ExclusiveStartKey = decode(nextToken);
                        ExclusiveStartKey = JSON.parse(ExclusiveStartKey);
                    }
                    params = {
                        TableName: TableName,
                        Limit: pageSize,
                        ExpressionAttributeNames: {},
                        ExpressionAttributeValues: {},
                        ExclusiveStartKey: ExclusiveStartKey,
                    };
                    i = 0;
                    if (typeof filterExpression === 'object') {
                        for (key in filterExpression) {
                            filterKey = key;
                            filterCon = filterExpression[filterKey].condition;
                            filterVal = filterExpression[filterKey].value;
                            if (filterKey && filterVal) {
                                i++;
                                if (filterCon === 'begins_with' || filterCon === 'contains') {
                                    if (i === 1)
                                        tempFilterExpression = "".concat(filterCon, "(#").concat(filterKey, ", :").concat(filterKey, ")");
                                    if (i > 1)
                                        tempFilterExpression = tempFilterExpression + " AND ".concat(filterCon, "(#").concat(filterKey, ", :").concat(filterKey, ")");
                                }
                                else {
                                    if (i === 1)
                                        tempFilterExpression = "#".concat(filterKey, " ").concat(filterCon, " :").concat(filterKey);
                                    if (i > 1)
                                        tempFilterExpression = tempFilterExpression + " AND #".concat(filterKey, " ").concat(filterCon, " :").concat(filterKey);
                                }
                                params.ExpressionAttributeNames["#".concat(filterKey)] = "".concat(filterKey);
                                params.ExpressionAttributeValues[":".concat(filterKey)] = filterVal;
                            }
                        }
                        params['FilterExpression'] = tempFilterExpression;
                    }
                    if (Object.keys(params.ExpressionAttributeNames).length === 0 &&
                        Object.keys(params.ExpressionAttributeValues).length === 0) {
                        delete params.ExpressionAttributeNames;
                        delete params.ExpressionAttributeValues;
                    }
                    return [4 /*yield*/, dynamodbScan(dynamoDb, params)];
                case 1:
                    res = _a.sent();
                    dataList.push.apply(dataList, res.Items);
                    _a.label = 2;
                case 2:
                    if (!(dataList.length < pageSize && Object.prototype.hasOwnProperty.call(res, 'LastEvaluatedKey'))) return [3 /*break*/, 4];
                    newParams = __assign(__assign({}, params), { ExclusiveStartKey: res.LastEvaluatedKey });
                    return [4 /*yield*/, dynamodbScan(dynamoDb, newParams)];
                case 3:
                    res = _a.sent();
                    dataList.push.apply(dataList, res.Items);
                    return [3 /*break*/, 2];
                case 4:
                    _nextToken = null;
                    if (res === null || res === void 0 ? void 0 : res.LastEvaluatedKey) {
                        _nextToken = encode(JSON.stringify(res.LastEvaluatedKey));
                    }
                    return [2 /*return*/, { items: dataList, newNextToken: _nextToken }];
            }
        });
    });
};
// Query Until Done
var queryUntilDone = function (dynamoDb_1, TableName_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([dynamoDb_1, TableName_1], args_1, true), void 0, function (dynamoDb, TableName, IndexName, partitionKeyName, partitionKeyValue, sortKeyName, sortKeyValue, sortKeyCondition, // Case BETWEEN not Cover in this function
    filterExpression, scanIndexForward) {
        var dataList, params, i, tempFilterExpression, key, filterKey, filterCon, filterVal, data, newParams;
        var _a, _b;
        if (IndexName === void 0) { IndexName = null; }
        if (sortKeyName === void 0) { sortKeyName = null; }
        if (sortKeyValue === void 0) { sortKeyValue = null; }
        if (sortKeyCondition === void 0) { sortKeyCondition = null; }
        if (filterExpression === void 0) { filterExpression = null; }
        if (scanIndexForward === void 0) { scanIndexForward = true; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    dataList = [];
                    params = {
                        TableName: TableName,
                        KeyConditionExpression: "#".concat(partitionKeyName, " = :").concat(partitionKeyName),
                        ExpressionAttributeNames: (_a = {},
                            _a["#".concat(partitionKeyName)] = "".concat(partitionKeyName),
                            _a),
                        ExpressionAttributeValues: (_b = {},
                            _b[":".concat(partitionKeyName)] = partitionKeyValue,
                            _b),
                    };
                    if (IndexName)
                        params['IndexName'] = IndexName;
                    if (scanIndexForward)
                        params['ScanIndexForward'] = scanIndexForward;
                    if (sortKeyValue) {
                        if (sortKeyCondition === 'begins_with' || sortKeyCondition === 'contains') {
                            params.KeyConditionExpression = "#".concat(partitionKeyName, " = :").concat(partitionKeyName, " AND ").concat(sortKeyCondition, "(#").concat(sortKeyName, ", :").concat(sortKeyName, ")");
                        }
                        else {
                            params.KeyConditionExpression = "#".concat(partitionKeyName, " = :").concat(partitionKeyName, " AND #").concat(sortKeyName, " ").concat(sortKeyCondition, " :").concat(sortKeyName);
                        }
                        params.ExpressionAttributeNames["#".concat(sortKeyName)] = "".concat(sortKeyName);
                        params.ExpressionAttributeValues[":".concat(sortKeyName)] = sortKeyValue;
                    }
                    i = 0;
                    if (typeof filterExpression === 'object') {
                        for (key in filterExpression) {
                            filterKey = key;
                            filterCon = filterExpression[filterKey].condition;
                            filterVal = filterExpression[filterKey].value;
                            if (filterKey && filterVal) {
                                i++;
                                if (filterCon === 'begins_with' || filterCon === 'contains') {
                                    if (i === 1)
                                        tempFilterExpression = "".concat(filterCon, "(#").concat(filterKey, ", :").concat(filterKey, ")");
                                    if (i > 1)
                                        tempFilterExpression = tempFilterExpression + " AND ".concat(filterCon, "(#").concat(filterKey, ", :").concat(filterKey, ")");
                                }
                                else {
                                    if (i === 1)
                                        tempFilterExpression = "#".concat(filterKey, " ").concat(filterCon, " :").concat(filterKey);
                                    if (i > 1)
                                        tempFilterExpression = tempFilterExpression + " AND #".concat(filterKey, " ").concat(filterCon, " :").concat(filterKey);
                                }
                                params.ExpressionAttributeNames["#".concat(filterKey)] = "".concat(filterKey);
                                params.ExpressionAttributeValues[":".concat(filterKey)] = filterVal;
                            }
                        }
                        params['FilterExpression'] = tempFilterExpression;
                    }
                    if (!IndexName)
                        delete params.IndexName;
                    return [4 /*yield*/, dynamoDb.query(params).promise()];
                case 1:
                    data = _c.sent();
                    dataList.push.apply(dataList, data.Items);
                    _c.label = 2;
                case 2:
                    if (!Object.prototype.hasOwnProperty.call(data, 'LastEvaluatedKey')) return [3 /*break*/, 4];
                    newParams = __assign(__assign({}, params), { ExclusiveStartKey: data.LastEvaluatedKey });
                    return [4 /*yield*/, dynamoDb.query(newParams).promise()];
                case 3:
                    data = _c.sent();
                    dataList.push.apply(dataList, data.Items);
                    return [3 /*break*/, 2];
                case 4: return [2 /*return*/, dataList];
            }
        });
    });
};
// Delete Single
var deleteSingleItem = function (dynamoDb_1, TableName_1, partitionKeyName_1, partitionKeyValue_1) {
    var args_1 = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        args_1[_i - 4] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([dynamoDb_1, TableName_1, partitionKeyName_1, partitionKeyValue_1], args_1, true), void 0, function (dynamoDb, TableName, partitionKeyName, partitionKeyValue, sortKeyName, sortKeyValue) {
        var Key, paramsGet;
        var _a;
        if (sortKeyName === void 0) { sortKeyName = null; }
        if (sortKeyValue === void 0) { sortKeyValue = null; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    Key = (_a = {},
                        _a[partitionKeyName] = partitionKeyValue,
                        _a);
                    if (sortKeyName && sortKeyValue)
                        Key[sortKeyName] = sortKeyValue;
                    paramsGet = {
                        TableName: TableName,
                        Key: Key,
                    };
                    return [4 /*yield*/, dynamoDb.delete(paramsGet).promise()];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    });
};
// Transaction Write
var transactWrite = function (dynamoDb, params) { return __awaiter(void 0, void 0, void 0, function () {
    var chunkSize, transactWritePromise, i, chunk;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chunkSize = 50;
                transactWritePromise = [];
                for (i = 0; i < params.TransactItems.length; i += chunkSize) {
                    chunk = params.TransactItems.slice(i, i + chunkSize);
                    transactWritePromise.push(dynamoDb
                        .transactWrite({
                        TransactItems: chunk,
                    })
                        .promise());
                }
                return [4 /*yield*/, Promise.all(transactWritePromise)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Update From Attribute
var dynamoDBUpdateFromAttributes = function (input, ignoreKeyList) {
    if (ignoreKeyList === void 0) { ignoreKeyList = []; }
    var UpdateExpression = 'SET';
    var ExpressionAttributeValues = {};
    var ExpressionAttributeNames = {};
    for (var _i = 0, _a = Object.entries(input); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (ignoreKeyList.includes(key))
            continue;
        UpdateExpression += " #".concat(key, " = :").concat(key, ",");
        ExpressionAttributeNames["#".concat(key)] = key;
        ExpressionAttributeValues[":".concat(key)] = value;
    }
    UpdateExpression = UpdateExpression.substr(0, UpdateExpression.length - 1);
    return {
        UpdateExpression: UpdateExpression,
        ExpressionAttributeValues: ExpressionAttributeValues,
        ExpressionAttributeNames: ExpressionAttributeNames,
    };
};
export { dynamodbQuery, dynamodbScan, dynamodbDelete, dynamodbUpdate, dynamodbPut, dynamodbBatchGetItems, getSingleItem, getMultipleItems, scanMultipleItems, queryUntilDone, deleteSingleItem, transactWrite, dynamoDBUpdateFromAttributes, };
//# sourceMappingURL=dynamoDB.js.map