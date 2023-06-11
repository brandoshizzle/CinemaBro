const supabase = require("../db")

async function getGuildMovies (guildId) {
	// Get movies
	const { data, error } = await supabase
		.from('guilds')
		.select(`
			id,
			movies!guild_movies(
				id,
				name
			)
		`)
		.eq('id', guildId)

	if (data && data.length > 0) {
		return {
			movies: data[0].movies.map(movie => {
				return { ...movie, id: String(movie.id) }
			}), error
		}
	}
	return { data: null, error }
}

module.exports = getGuildMovies