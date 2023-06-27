
function getMovieRating (ratingsArray) {
	return Math.round(ratingsArray.reduce((sum, cv) => sum + cv.rating, 0) / ratingsArray.length)
}

module.exports = getMovieRating