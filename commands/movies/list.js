const { SlashCommandBuilder } = require('discord.js');
const getGuildMovies = require('../../util/getGuildMovies');
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription("Retrieve the cinema's movie list"),
	async execute (interaction) {
		// Let him cook
		await interaction.deferReply();

		// Get movies
		const { movies, error } = await getGuildMovies(interaction.guild, 'rating')

		if (error) {
			return logError(interaction, error, { edit: true })
		}

		const movieRatings = movies.map(movie => {
			return {
				name: movie.name,
				rating: movie.ratings.reduce((sum, rating) => sum + rating.rating, 0) / movie.ratings.length
			}
		})

		let replyString = `The ${interaction.guild.name} Movie List\n`
		replyString = replyString + movieRatings.map(movie => `**${movie.rating}** ${movie.name}`).join('\n')
		return interaction.editReply(replyString);
	},
};