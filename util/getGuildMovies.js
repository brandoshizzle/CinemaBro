const supabase = require("../db")
const getMovieRating = require("./getMovieRating")
const getGuildMembers = require("../functions/getGuildMembers")

async function getGuildMovies (guild, sortBy) {

	// Get list of user ids in guild
	const members = await getGuildMembers(guild.id)

	// Get movies
	const { data, error } = await supabase
		.from('guilds')
		.select(`
			id,
			movies!guild_movies(
				id,
				name,
				year,
				ratings (
					rating,
					user_id
				)
			)
		`)
		.eq('id', guild.id)
		.in('movies.ratings.user_id', members.map(m => m.id))
		.single()

	// Calculate overall guild ratings & sort descending
	const movies = data.movies.map(movie => ({
		...movie,
		id: String(movie.id),
		ratings: movie.ratings.map(r => ({
			...r,
			name: members.find(m => m.id === r.user_id).name
		})),
		rating: getMovieRating(movie.ratings)
	})).sort((a, b) => (b.rating - a.rating) || (isNaN(a.rating) - isNaN(b.rating)))

	if (sortBy === 'name') {
		movies.sort()
	}

	const moviesMessageArray = []
	movies.forEach(movie => moviesMessageArray.push(`\`${movie.rating.toFixed(1)}  ${movie.name} ${movie?.year ? `(${movie?.year})` : ''}\``))

	return { movies, moviesMessageArray, error }
}

module.exports = getGuildMovies