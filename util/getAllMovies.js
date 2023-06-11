const supabase = require("../db")

async function getAllMovies () {
	// Get movies
	const { data, error } = await supabase
		.from('movies')
		.select(`
			id,
			name
		`)

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