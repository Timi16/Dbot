/**
 * Groq AI / NLP Type Definitions
 */
export var Intent;
(function (Intent) {
    // Wallet management
    Intent["CREATE_WALLET"] = "create_wallet";
    // Balance
    Intent["CHECK_BALANCE"] = "check_balance";
    // Transactions
    Intent["SEND_CRYPTO"] = "send_crypto";
    Intent["RECEIVE_CRYPTO"] = "receive_crypto";
    Intent["SWAP_TOKENS"] = "swap_tokens";
    // History
    Intent["TRANSACTION_HISTORY"] = "transaction_history";
    // Address
    Intent["VIEW_ADDRESS"] = "view_address";
    // Settings
    Intent["SETTINGS"] = "settings";
    Intent["CHANGE_PIN"] = "change_pin";
    Intent["TOGGLE_PIN"] = "toggle_pin";
    // Help
    Intent["HELP"] = "help";
    // Unknown
    Intent["UNKNOWN"] = "unknown";
    // Confirmation
    Intent["CONFIRM"] = "confirm";
    Intent["CANCEL"] = "cancel";
    Intent["SETUP"] = "SETUP";
    Intent["WITHDRAW"] = "WITHDRAW";
})(Intent || (Intent = {}));
//# sourceMappingURL=groq.types.js.map