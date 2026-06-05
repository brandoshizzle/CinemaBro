const getMovieRating = require("./getMovieRating")
const getGuildMembers = require("../functions/getGuildMembers")
const { Guilds } = require("../schema/schema")

async function getGuildMovies (guild, sortBy) {

	// Get list of user ids in guild
	const members = await getGuildMembers(guild.id)

	// Get movies
	let data, error
	try {
		// Fetch movies and ratings, but filter out ratings from users not in guild
		data = await Guilds.findOne({ id: guild.id }).populate({
			path: 'movies',
			populate: {
				path: 'ratings',
				model: 'Rating',
				match: { user_id: { $in: members.map(m => m.id) } }
			}
		})
	} catch (err) {
		console.error('Error fetching guild movies from MongoDB:', err)
		error = 'Failed to fetch guild movies: ' + err.message
	}
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