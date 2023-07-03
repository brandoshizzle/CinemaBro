const getUsername = require("./getUsername")

module.exports = async function guildStats (movieList) {
	// movieList is array of objects with {name, rating, ratings} sorted descending by rating
	const stats = {}

	stats.mean = Math.floor(movieList.reduce((sum, currentMovie) => sum + currentMovie.rating, 0) / movieList.length)
	stats.median = movieList[Math.floor(movieList.length / 2)]
	stats.max = movieList[0]
	stats.min = movieList[movieList.length - 1]

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

	stats.maxAverage = { ...maxAverage, name: await getUsername(maxAverage.id) }
	stats.minAverage = { ...minAverage, name: await getUsername(minAverage.id) }


	return stats
}