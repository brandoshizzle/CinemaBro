const { Pool } = require('pg');
const { databaseUrl } = require('../config');

let pool;

function getPool () {
	if (!databaseUrl) {
		throw new Error('Missing required environment variable: DATABASE_URL');
	}

	if (!pool) {
		pool = new Pool({ connectionString: databaseUrl });
	}

	return pool;
}

module.exports = {
	query: (text, params) => getPool().query(text, params),
	getPool
};
