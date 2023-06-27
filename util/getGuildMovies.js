const supabase = require("../db")
const getMovieRating = require("./getMovieRating")
const client = require('../client')

async function getGuildMovies (guild, sortBy) {

	// Get sort field from sortBy
	const sortField = sortBy === 'rating' ? 'movies.rating' : 'name'
	const sortAscending = sortBy === 'alphabetical'

	// Get list of user ids in guild
	console.log('beans')
	// const members = await guild.members.fetch()
	const guildData = client.guilds.cache.get(guild.id)
	const members = await guildData.members.fetch()
	const users = members.map(m => m.user.id)
	console.log(users)

	// Get movies
	const { data, error } = await supabase
		.from('guilds')
		.select(`
			id,
			movies!guild_movies(
				id,
				name,
				ratings (
					rating,
					user_id
				)
			)
		`)
		.eq('id', guild.id)
		.in('movies.ratings.user_id', users)
		.single()
	// .order(sortField, sortAscending)

	// Calculate overall guild ratings
	const movies = data.movies.map(movie => ({
		...movie,
		id: String(movie.id),
		rating: getMovieRating(movie.ratings)
	})).sort((a, b) => (b.rating - a.rating) || (isNaN(a.rating) - isNaN(b.rating)))

	return { movies, error }
}

module.exports = getGuildMovies