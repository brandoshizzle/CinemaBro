
function getMovieRating (ratingsArray) {
	if (!ratingsArray || ratingsArray.length === 0) {
		return -1
	}
	return ratingsArray.reduce((sum, cv) => sum + cv.rating, 0) / ratingsArray.length
}

module.exports = getMovieRating