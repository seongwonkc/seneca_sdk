import { ValidationError } from "../../types/errors.js";
export function validateQuestionData(qd, obsIndex) {
    const prefix = "observations[" + obsIndex + "].questionData";
    if (typeof qd.questionId !== "string" || qd.questionId.trim().length === 0) {
        throw new ValidationError(prefix + ".questionId is required and must be a non-empty string");
    }
    if (typeof qd.isCorrect !== "boolean") {
        throw new ValidationError(prefix + ".isCorrect is required and must be a boolean");
    }
    if (typeof qd.timeSpentSeconds !== "number" || !Number.isFinite(qd.timeSpentSeconds)) {
        throw new ValidationError(prefix + ".timeSpentSeconds is required and must be a finite number");
    }
    if (typeof qd.wasFlagged !== "boolean") {
        throw new ValidationError(prefix + ".wasFlagged is required and must be a boolean");
    }
    if (typeof qd.numberOfChanges !== "number" || !Number.isFinite(qd.numberOfChanges)) {
        throw new ValidationError(prefix + ".numberOfChanges is required and must be a finite number");
    }
    if (typeof qd.positionInSession !== "number" ||
        !Number.isInteger(qd.positionInSession) ||
        qd.positionInSession < 1 ||
        qd.positionInSession > 200) {
        throw new ValidationError(prefix + ".positionInSession must be an integer between 1 and 200 inclusive");
    }
    if (typeof qd.skippedFirstTime !== "boolean") {
        throw new ValidationError(prefix + ".skippedFirstTime is required and must be a boolean");
    }
}
//# sourceMappingURL=validateQuestionData.js.map