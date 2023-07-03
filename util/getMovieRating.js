
function getMovieRating (ratingsArray) {
	return ratingsArray.reduce((sum, cv) => sum + cv.rating, 0) / ratingsArray.length
}

module.exports = getMovieRating