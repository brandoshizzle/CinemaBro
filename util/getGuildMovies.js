const getMovieRating = require("./getMovieRating")
const getGuildMembers = require("../functions/getGuildMembers")
const { Guilds } = require("../schema/schema")

async function getGuildMovies (guild, sortBy) {

	// Get list of user ids in guild
	const members = await getGuildMembers(guild.id)

	// Get movies
	let data, error
	try {
		// Fetch guild with populated movies
		data = await Guilds.findOne({ '_id': guild.id }).populate('movies', 'id name year').lean()

		// Fetch ratings for these movies from users in guild
		const { Ratings } = require('../schema/schema')
		const movieIds = data.movies.map(m => m._id)
		const memberIds = members.map(m => m.id)

		const ratings = await Ratings.find({
			'_id.movie_id': { $in: movieIds },
			'_id.user_id': { $in: memberIds }
		})

		// Attach ratings to their respective movies
		data.movies = data.movies.map(movie => ({
			...movie,
			ratings: ratings.filter(r => String(r._id.movie_id) === String(movie._id))
		}))

		console.log(`Fetched ${data?.movies?.length || 0} movies for guild ${guild.name} (${guild.id})`)
		console.log('example movie:', data)
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
			name: members.find(m => m.id === r._id.user_id).name
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