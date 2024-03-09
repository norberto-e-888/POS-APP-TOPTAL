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
  misc: {
    port: parseInt(process.env.PORT, 10),
  },
});

export type Config = ReturnType<typeof config>;
