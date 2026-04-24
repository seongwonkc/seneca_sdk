"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayPost = gatewayPost;
const errors_js_1 = require("../../types/errors.js");
function getEnv(key) {
    const val = process.env[key];
    if (!val)
        throw new Error("Missing required env var: " + key);
    return val;
}
function throwForErrorCode(code, message, statusCode) {
    switch (code) {
        case "UNAUTHORIZED": throw new errors_js_1.UnauthorizedError(message);
        case "TOKEN_EXPIRED": throw new errors_js_1.TokenExpiredError();
        case "TOKEN_SPENT": throw new errors_js_1.TokenSpentError();
        case "NOT_FOUND": throw new errors_js_1.NotFoundError(message);
        case "BRIDGE_EXISTS": throw new errors_js_1.ConflictError(message);
        case "IDENTITY_MISMATCH": throw new errors_js_1.IdentityMismatchError(message);
        case "VALIDATION": throw new errors_js_1.ValidationError(message);
        case "RATE_LIMITED": throw new errors_js_1.RateLimitedError(message);
        default: throw new errors_js_1.SenecaError(message, code, statusCode);
    }
}
async function gatewayPost(surface, method, body) {
    const gatewayUrl = getEnv("SENECA_SDK_GATEWAY_URL");
    const limbName = getEnv("SENECA_LIMB_NAME");
    const limbKey = getEnv("SENECA_LIMB_KEY");
    const specVersion = process.env["SENECA_SDK_VERSION"] ?? "0";
    const url = gatewayUrl + "/" + surface + "/" + method;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-seneca-spec-version": specVersion,
            "x-limb-name": limbName,
            "x-limb-key": limbKey,
        },
        body: JSON.stringify(body),
    });
    let parsed;
    try {
        parsed = await res.json();
    }
    catch {
        throw new errors_js_1.SenecaError("Gateway returned non-JSON response (HTTP " + res.status + ")", "INTERNAL", res.status);
    }
    if (!res.ok) {
        const envelope = parsed;
        const { code, message, statusCode } = envelope?.error ?? {
            code: "INTERNAL",
            message: "HTTP " + res.status,
            statusCode: res.status,
        };
        throwForErrorCode(code, message, statusCode);
    }
    return parsed;
}
//# sourceMappingURL=client.js.map