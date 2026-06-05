const { Movies } = require("../schema/schema")

async function getAllMovies () {
	// Get movies
	let data, error
	try {
		data = await Movies.find({}, 'id name').lean()
	} catch (err) {
		console.error('Error fetching movies from MongoDB:', err)
		error = 'Failed to fetch movies: ' + err.message
	}

	if (data && data.length > 0) {
		return {
			movies: data.map(movie => {
				return { ...movie, id: String(movie.id) }
			}), error
		}
	}
	return { data: null, error }
}

module.exports = getAllMovies