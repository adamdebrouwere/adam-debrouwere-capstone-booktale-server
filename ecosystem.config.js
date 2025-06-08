require('dotenv').config();

module.exports = {
  apps: [
    {
      name: "booktale-app",
      script: "./src/server.js",
      env: {
        PG_CONNECTION_STRING: process.env.PG_CONNECTION_STRING
      }
    }
  ]
}
