import "dotenv/config";
console.log("connection-string", process.env.PG_CONNECTION_STRING)

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
