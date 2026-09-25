const getUsername = require("./getUsername")
const { jStat } = require('jstat');

module.exports = async function guildStats (interaction, movieList) {
	// movieList is array of objects with {name, rating, ratings} sorted descending by rating
	try {
		const stats = {}

		// Add standard deviation only for movies with ratings.
		for (let i = 0; i < movieList.length; i++) {
			const ratings = movieList[i].ratings.map(rating => rating.rating)
			movieList[i].stdev = ratings.length > 0 ? jStat.stdev(ratings) : null
		}

		stats.count = movieList.length
		stats.mean = movieList.reduce((sum, currentMovie) => sum + currentMovie.rating, 0) / movieList.length
		stats.median = movieList[Math.floor(movieList.length / 2)]
		stats.max = movieList[0]
		stats.min = movieList[movieList.length - 1]
		const ratedMovies = movieList.filter(movie => movie.stdev !== null)
		stats.maxstdev = ratedMovies.length > 0
			? ratedMovies.reduce((prev, current) => (prev.stdev > current.stdev) ? prev : current)
			: { name: 'N/A', stdev: null }
		stats.minstdev = ratedMovies.length > 0
			? ratedMovies.reduce((prev, current) => (prev.stdev < current.stdev) ? prev : current)
			: { name: 'N/A', stdev: null }

		// Get all ratings by member ID
		const ratingsByMember = []
		for (let i = 0; i < movieList.length; i++) {
			for (let j = 0; j < movieList[i].ratings.length; j++) {
				const rating = movieList[i].ratings[j]
				const userId = rating._id.user_id
				let memberIndex = ratingsByMember.findIndex(item => item.id === userId)
				if (memberIndex === -1) {
					ratingsByMember.push({ id: userId, ratings: [] })
					memberIndex = ratingsByMember.length - 1
				}
				ratingsByMember[memberIndex].ratings.push(rating.rating)
			}
		}

		// Highest/lowest rater in guild
		let maxAverage = null
		let minAverage = null
		for (let i = 0; i < ratingsByMember.length; i++) {
			ratingsByMember[i].average = ratingsByMember[i].ratings.reduce((sum, currentNum) => sum + currentNum, 0) / ratingsByMember[i].ratings.length
			if (ratingsByMember[i].ratings.length > 4 && (!maxAverage || ratingsByMember[i].average > maxAverage.average)) {
				maxAverage = { id: ratingsByMember[i].id, average: ratingsByMember[i].average }
			}
			if (ratingsByMember[i].ratings.length > 4 && (!minAverage || ratingsByMember[i].average < minAverage.average)) {
				minAverage = { id: ratingsByMember[i].id, average: ratingsByMember[i].average }
			}
		}
		stats.maxAverage = maxAverage
			? { ...maxAverage, name: await getUsername(interaction.guild.id, maxAverage.id) }
			: { id: null, average: null, name: 'N/A' }
		stats.minAverage = minAverage
			? { ...minAverage, name: await getUsername(interaction.guild.id, minAverage.id) }
			: { id: null, average: null, name: 'N/A' }
		const statsMessageArray = [
			`__${interaction.guild.name} Stats__`,
			`Movies watched: **${stats.count}**`,
			`Average movie rating: **${stats.mean.toFixed(1)}**`,
			`Highest rated movie: **${stats.max.rating.toFixed(1)}** ${stats.max.name}`,
			`Lowest rated movie: **${stats.min.rating.toFixed(1)}** ${stats.min.name}`,
			`Median movie: **${stats.median.rating.toFixed(1)}** ${stats.median.name}`,
			`Biggest enjoyer: **${stats.maxAverage.name}** (average rating: ${stats.maxAverage.average === null ? 'N/A' : stats.maxAverage.average.toFixed(1)})`,
			`Harshest critic: **${stats.minAverage.name}** (average rating: ${stats.minAverage.average === null ? 'N/A' : stats.minAverage.average.toFixed(1)})`,
			`Most polarizing movie: **${stats.maxstdev.name}** (standard devation: ${stats.maxstdev.stdev === null ? 'N/A' : stats.maxstdev.stdev.toFixed(1)})`,
			`Least polarizing movie: **${stats.minstdev.name}** (standard devation: ${stats.minstdev.stdev === null ? 'N/A' : stats.minstdev.stdev.toFixed(1)})`,
		]
		const statsMessage = statsMessageArray.join('\n')

		return { stats, statsMessage }
	} catch (error) {
		return { error }
	}

}