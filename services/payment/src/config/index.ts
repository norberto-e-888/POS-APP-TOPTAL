export const config = () => ({
  amqp: {
    url: process.env.AMQP_URL,
  },
  mongo: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  cookie: {
    secret: process.env.COOKIE_SECRET,
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secret: process.env.STRIPE_SECRET,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    accountId: process.env.STRIPE_ACCOUNT_ID,
  },
  misc: {
    port: parseInt(process.env.PORT, 10),
  },
});

export type Config = ReturnType<typeof config>;
