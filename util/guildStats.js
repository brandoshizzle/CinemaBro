const getUsername = require("./getUsername")
const { jStat } = require('jstat');

module.exports = async function guildStats (interaction, movieList) {
	// movieList is array of objects with {name, rating, ratings} sorted descending by rating
	const stats = {}

	// Add std dev property to each movie
	for (let i = 0; i < movieList.length; i++) {
		movieList[i].stdev = jStat.stdev(movieList[i].ratings.map(rating => rating.rating))
	}

	stats.count = movieList.length
	stats.mean = movieList.reduce((sum, currentMovie) => sum + currentMovie.rating, 0) / movieList.length
	stats.median = movieList[Math.floor(movieList.length / 2)]
	stats.max = movieList[0]
	stats.min = movieList[movieList.length - 1]
	stats.maxstdev = movieList.reduce((prev, current) => (prev.stdev > current.stdev) ? prev : current)
	stats.minstdev = movieList.reduce((prev, current) => (prev.stdev < current.stdev) ? prev : current)

	// Get all ratings by member ID
	const ratingsByMember = []
	for (let i = 0; i < movieList.length; i++) {
		for (let j = 0; j < movieList[i].ratings.length; j++) {
			const rating = movieList[i].ratings[j]
			let memberIndex = ratingsByMember.findIndex(item => item.id === rating.user_id)
			if (memberIndex === -1) {
				ratingsByMember.push({ id: rating.user_id, ratings: [] })
				memberIndex = ratingsByMember.length - 1
			}
			ratingsByMember[memberIndex].ratings.push(rating.rating)
		}
	}

	// Highest/lowest rater in guild
	let maxAverage = { id: null, average: 0 }
	let minAverage = { id: null, average: 100 }
	for (let i = 0; i < ratingsByMember.length; i++) {
		ratingsByMember[i].average = Math.floor(ratingsByMember[i].ratings.reduce((sum, currentNum) => sum + currentNum, 0) / ratingsByMember[i].ratings.length)
		if (ratingsByMember[i].average > maxAverage.average && ratingsByMember[i].ratings.length > 4) {
			maxAverage = { id: ratingsByMember[i].id, average: ratingsByMember[i].average }
		}
		if (ratingsByMember[i].average < minAverage.average && ratingsByMember[i].ratings.length > 4) {
			minAverage = { id: ratingsByMember[i].id, average: ratingsByMember[i].average }
		}
	}

	stats.maxAverage = { ...maxAverage, name: await getUsername(interaction.guild.id, maxAverage.id) }
	stats.minAverage = { ...minAverage, name: await getUsername(interaction.guild.id, minAverage.id) }

	const statsMessageArray = [
		`__${interaction.guild.name} Stats__`,
		`Movies watched: **${stats.count}**`,
		`Average movie rating: **${stats.mean.toFixed(1)}**`,
		`Highest rated movie: **${stats.max.rating.toFixed(1)}** ${stats.max.name}`,
		`Lowest rated movie: **${stats.min.rating.toFixed(1)}** ${stats.min.name}`,
		`Median movie: **${stats.median.rating.toFixed(1)}** ${stats.median.name}`,
		`Biggest enjoyer: **${stats.maxAverage.name}** (average rating: ${stats.maxAverage.average.toFixed(1)})`,
		`Harshest critic: **${stats.minAverage.name}** (average rating: ${stats.minAverage.average.toFixed(1)})`,
		`Most polarizing movie: **${stats.maxstdev.name}** (standard devation: ${stats.maxstdev.stdev.toFixed(1)})`,
		`Least polarizing movie: **${stats.minstdev.name}** (standard devation: ${stats.minstdev.stdev.toFixed(1)})`,
	]
	const statsMessage = statsMessageArray.join('\n')

	return { stats, statsMessage }
}