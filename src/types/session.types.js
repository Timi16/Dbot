/**
 * Session and Conversation State Type Definitions
 */
export var OnboardingStep;
(function (OnboardingStep) {
    OnboardingStep["AWAITING_NAME"] = "AWAITING_NAME";
    OnboardingStep["AWAITING_PIN"] = "AWAITING_PIN";
    OnboardingStep["CONFIRMING_PIN"] = "CONFIRMING_PIN";
    OnboardingStep["DISPLAYING_SEED"] = "DISPLAYING_SEED";
    OnboardingStep["CONFIRMING_SEED_SAVED"] = "CONFIRMING_SEED_SAVED";
    OnboardingStep["COMPLETED"] = "COMPLETED";
    OnboardingStep["AWAITING_PIN_CHOICE"] = "AWAITING_PIN_CHOICE";
})(OnboardingStep || (OnboardingStep = {}));
export var MainStep;
(function (MainStep) {
    MainStep["IDLE"] = "IDLE";
    MainStep["MENU"] = "MENU";
    // Balance flow
    MainStep["CHECK_BALANCE"] = "CHECK_BALANCE";
    MainStep["CHECK_BALANCE_CHAIN"] = "CHECK_BALANCE_CHAIN";
    // Send flow
    MainStep["SEND_CRYPTO_CHAIN"] = "SEND_CRYPTO_CHAIN";
    MainStep["SEND_CRYPTO_AMOUNT"] = "SEND_CRYPTO_AMOUNT";
    MainStep["SEND_CRYPTO_ADDRESS"] = "SEND_CRYPTO_ADDRESS";
    MainStep["SEND_CRYPTO_CONFIRM"] = "SEND_CRYPTO_CONFIRM";
    MainStep["SEND_CRYPTO_PIN"] = "SEND_CRYPTO_PIN";
    // Receive flow
    MainStep["RECEIVE_CRYPTO"] = "RECEIVE_CRYPTO";
    MainStep["RECEIVE_CRYPTO_CHAIN"] = "RECEIVE_CRYPTO_CHAIN";
    // Swap flow
    MainStep["_TOKENS_CHAIN"] = "SWAP_TOKENS_CHAIN";
    MainStep["SWAP_FROM_TOKEN"] = "SWAP_FROM_TOKEN";
    MainStep["SWAP_TO_TOKEN"] = "SWAP_TO_TOKEN";
    MainStep["SWAP_AMOUNT"] = "SWAP_AMOUNT";
    MainStep["SWAP_CONFIRM"] = "SWAP_CONFIRM";
    MainStep["SWAP_PIN"] = "SWAP_PIN";
    // Transaction history
    MainStep["TRANSACTION_HISTORY"] = "TRANSACTION_HISTORY";
    MainStep["TRANSACTION_HISTORY_CHAIN"] = "TRANSACTION_HISTORY_CHAIN";
    // Settings
    MainStep["SETTINGS_MENU"] = "SETTINGS_MENU";
    MainStep["SETTINGS_PIN_TOGGLE"] = "SETTINGS_PIN_TOGGLE";
    MainStep["SETTINGS_PIN_AMOUNT"] = "SETTINGS_PIN_AMOUNT";
    MainStep["SETTINGS_CHANGE_PIN"] = "SETTINGS_CHANGE_PIN";
    MainStep["SETTINGS_CHANGE_PIN_OLD"] = "SETTINGS_CHANGE_PIN_OLD";
    MainStep["SETTINGS_CHANGE_PIN_NEW"] = "SETTINGS_CHANGE_PIN_NEW";
    MainStep["SETTINGS_CHANGE_PIN_CONFIRM"] = "SETTINGS_CHANGE_PIN_CONFIRM";
    // View address
    MainStep["VIEW_ADDRESS"] = "VIEW_ADDRESS";
    MainStep["VIEW_ADDRESS_CHAIN"] = "VIEW_ADDRESS_CHAIN";
    // Help
    MainStep["HELP"] = "HELP";
    MainStep["SWAP_TOKENS_CHAIN"] = "SWAP_TOKENS_CHAIN";
    MainStep["SWAP_TOKENS_FROM"] = "SWAP_TOKENS_FROM";
    MainStep["SWAP_TOKENS_TO"] = "SWAP_TOKENS_TO";
    MainStep["SWAP_TOKENS_AMOUNT"] = "SWAP_TOKENS_AMOUNT";
    MainStep["SWAP_TOKENS_CONFIRM"] = "SWAP_TOKENS_CONFIRM";
    MainStep["SWAP_TOKENS_PIN"] = "SWAP_TOKENS_PIN";
})(MainStep || (MainStep = {}));
//# sourceMappingURL=session.types.js.map