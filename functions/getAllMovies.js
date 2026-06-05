const store = require('../db/store');

async function getAllMovies () {
	return store.getAllMovies();
}

module.exports = getAllMovies