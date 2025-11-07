import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    TWILIO_ACCOUNT_SID: z.ZodString;
    TWILIO_AUTH_TOKEN: z.ZodString;
    TWILIO_WHATSAPP_NUMBER: z.ZodString;
    GROQ_API_KEY: z.ZodString;
    GROQ_MODEL: z.ZodDefault<z.ZodString>;
    SESSION_EXPIRY_MINUTES: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    MAX_PIN_ATTEMPTS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    ENCRYPTION_MASTER_KEY: z.ZodString;
    ETHEREUM_RPC_URL: z.ZodString;
    BASE_RPC_URL: z.ZodString;
    BSC_RPC_URL: z.ZodString;
    OG_RPC_URL: z.ZodString;
    SOLANA_RPC_URL: z.ZodString;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_WHATSAPP_NUMBER: string;
    GROQ_API_KEY: string;
    GROQ_MODEL: string;
    SESSION_EXPIRY_MINUTES: number;
    MAX_PIN_ATTEMPTS: number;
    ENCRYPTION_MASTER_KEY: string;
    ETHEREUM_RPC_URL: string;
    BASE_RPC_URL: string;
    BSC_RPC_URL: string;
    OG_RPC_URL: string;
    SOLANA_RPC_URL: string;
};
export {};
//# sourceMappingURL=env.config.d.ts.map