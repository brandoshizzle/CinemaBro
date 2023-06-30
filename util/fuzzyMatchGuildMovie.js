const getGuildMovies = require("./getGuildMovies");
const Fuse = require('fuse.js')

async function fuzzyMatchGuildMovie (name, guild, movieArray) {
	const { movies } = movieArray || await getGuildMovies(guild)
	const fuse = new Fuse(movies, {
		includeScore: true,
		keys: ['name']
	})

	const result = fuse.search(name)

	return Number(result[0].item.id)

}

module.exports = fuzzyMatchGuildMovie