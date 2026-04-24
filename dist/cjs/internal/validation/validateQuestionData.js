"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuestionData = validateQuestionData;
const errors_js_1 = require("../../types/errors.js");
function validateQuestionData(qd, obsIndex) {
    const prefix = "observations[" + obsIndex + "].questionData";
    if (typeof qd.questionId !== "string" || qd.questionId.trim().length === 0) {
        throw new errors_js_1.ValidationError(prefix + ".questionId is required and must be a non-empty string");
    }
    if (typeof qd.isCorrect !== "boolean") {
        throw new errors_js_1.ValidationError(prefix + ".isCorrect is required and must be a boolean");
    }
    if (typeof qd.timeSpentSeconds !== "number" || !Number.isFinite(qd.timeSpentSeconds)) {
        throw new errors_js_1.ValidationError(prefix + ".timeSpentSeconds is required and must be a finite number");
    }
    if (typeof qd.wasFlagged !== "boolean") {
        throw new errors_js_1.ValidationError(prefix + ".wasFlagged is required and must be a boolean");
    }
    if (typeof qd.numberOfChanges !== "number" || !Number.isFinite(qd.numberOfChanges)) {
        throw new errors_js_1.ValidationError(prefix + ".numberOfChanges is required and must be a finite number");
    }
    if (typeof qd.positionInSession !== "number" ||
        !Number.isInteger(qd.positionInSession) ||
        qd.positionInSession < 1 ||
        qd.positionInSession > 200) {
        throw new errors_js_1.ValidationError(prefix + ".positionInSession must be an integer between 1 and 200 inclusive");
    }
    if (typeof qd.skippedFirstTime !== "boolean") {
        throw new errors_js_1.ValidationError(prefix + ".skippedFirstTime is required and must be a boolean");
    }
}
//# sourceMappingURL=validateQuestionData.js.map