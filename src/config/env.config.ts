import { z, ZodError } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().startsWith('whatsapp:'),

  // Groq
  GROQ_API_KEY: z.string().startsWith('gsk_'),
  GROQ_MODEL: z.string().default('meta-llama/llama-4-scout-17b-16e-instruct'),

  // Security
  SESSION_EXPIRY_MINUTES: z.coerce.number().default(15),
  MAX_PIN_ATTEMPTS: z.coerce.number().default(3),
  // Enforce 64 hex chars explicitly (optional but safer)
  ENCRYPTION_MASTER_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be a 64-char hex string'),

  // Blockchain RPCs
  ETHEREUM_RPC_URL: z.string().url(),
  BASE_RPC_URL: z.string().url(),
  BSC_RPC_URL: z.string().url(),
  OG_RPC_URL: z.string().url(),
  SOLANA_RPC_URL: z.string().url(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Invalid environment variables:')
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
      })
    } else {
      console.error('Unexpected error while validating env:', error)
    }
    process.exit(1)
  }
}

export const env = validateEnv()
