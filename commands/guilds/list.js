const { SlashCommandBuilder } = require('discord.js');
const getGuildMovies = require('../../util/getGuildMovies');
const logError = require('../../util/logError');
const splitSend = require('../../util/splitSend');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription("Retrieve the cinema's movie list"),
	async execute (interaction) {
		// Let him cook
		await interaction.reply({ content: `Sure thing boss, let me load the ${interaction.guild.name} movie list...` })

		// Get movies
		const { movies, error } = await getGuildMovies(interaction.guild, 'rating')

		if (error) {
			return logError(interaction, error, { edit: true })
		}

		let replyArray = [`The ${interaction.guild.name} Movie List\n`]
		movies.forEach(movie => replyArray.push(`**${movie.rating}** ${movie.name} ${movie?.year ? `(${movie?.year})` : ''}`))
		await splitSend(interaction, replyArray, { edit: true })
		return
	},
};