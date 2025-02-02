import knex from 'knex';
import configuration from '../../knexfile.js';

const db = knex(configuration);

export default db;