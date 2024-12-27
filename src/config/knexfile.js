import dotenv from 'dotenv';
dotenv.config();

export default {
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: ['knex', 'public'],
  pool: { min: 2, max: 10 },
  debug: true, 
};

