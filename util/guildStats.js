
module.exports = function guildStats (movieList) {
	// movieList is array of objects with {name, rating} sorted descending by rating
	const stats = {}

	stats.mean = movieList.reduce((sum, currentMovie) => sum + currentMovie.rating, 0) / movieList.length
	stats.median = movieList[Math.floor(movieList.length / 2)]
	stats.max = movieList[0]
	stats.min = movieList[movieList.length]

	return stats
}