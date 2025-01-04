import "dotenv/config";

export default {
  client: "pg",
  connection: process.env.PG_CONNECTION_STRING,
};
