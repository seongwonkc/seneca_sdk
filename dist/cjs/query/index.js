"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserData = exports.exportUserData = exports.getUserModel = void 0;
/**
 * Query surface — limbs read user personalization state.
 * Authenticated with a per-limb API key + the linked user's scoped auth.
 */
var getUserModel_js_1 = require("./getUserModel.js");
Object.defineProperty(exports, "getUserModel", { enumerable: true, get: function () { return getUserModel_js_1.getUserModel; } });
var exportUserData_js_1 = require("./exportUserData.js");
Object.defineProperty(exports, "exportUserData", { enumerable: true, get: function () { return exportUserData_js_1.exportUserData; } });
var deleteUserData_js_1 = require("./deleteUserData.js");
Object.defineProperty(exports, "deleteUserData", { enumerable: true, get: function () { return deleteUserData_js_1.deleteUserData; } });
//# sourceMappingURL=index.js.map