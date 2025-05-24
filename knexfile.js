import "dotenv/config";

export default {
  client: "pg",
  connection: process.env.PG_CONNECTION_STRING,
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};
