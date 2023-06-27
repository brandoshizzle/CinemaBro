const getAllMovies = require("./getAllMovies");

async function movieAutoComplete (interaction) {
	const focusedValue = interaction.options.getFocused();
	const { movies } = await getAllMovies()
	const filtered = movies.filter(movie => movie.name.toLowerCase().includes(focusedValue.toLowerCase()));
	return interaction.respond(
		filtered.map(movie => ({ name: movie.name, value: movie.id })).slice(0, 25),
	);
}

module.exports = movieAutoComplete