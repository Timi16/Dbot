/**
 * API and Response Type Definitions
 */
export var ApiErrorCode;
(function (ApiErrorCode) {
    // Authentication errors
    ApiErrorCode["INVALID_SIGNATURE"] = "INVALID_SIGNATURE";
    ApiErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    // User errors
    ApiErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ApiErrorCode["USER_NOT_ONBOARDED"] = "USER_NOT_ONBOARDED";
    ApiErrorCode["ONBOARDING_INCOMPLETE"] = "ONBOARDING_INCOMPLETE";
    // Wallet errors
    ApiErrorCode["WALLET_NOT_FOUND"] = "WALLET_NOT_FOUND";
    ApiErrorCode["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
    ApiErrorCode["INVALID_ADDRESS"] = "INVALID_ADDRESS";
    ApiErrorCode["INVALID_AMOUNT"] = "INVALID_AMOUNT";
    // PIN errors
    ApiErrorCode["INVALID_PIN"] = "INVALID_PIN";
    ApiErrorCode["PIN_LOCKED"] = "PIN_LOCKED";
    ApiErrorCode["PIN_REQUIRED"] = "PIN_REQUIRED";
    // Transaction errors
    ApiErrorCode["TRANSACTION_FAILED"] = "TRANSACTION_FAILED";
    ApiErrorCode["TRANSACTION_NOT_FOUND"] = "TRANSACTION_NOT_FOUND";
    // Chain errors
    ApiErrorCode["UNSUPPORTED_CHAIN"] = "UNSUPPORTED_CHAIN";
    ApiErrorCode["RPC_ERROR"] = "RPC_ERROR";
    // General errors
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ApiErrorCode || (ApiErrorCode = {}));
//# sourceMappingURL=api.types.js.map