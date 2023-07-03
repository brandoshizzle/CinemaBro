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
		const { moviesMessageArray, error } = await getGuildMovies(interaction.guild, 'rating')

		if (error) {
			return logError(interaction, error, { edit: true })
		}

		let replyArray = [`__The ${interaction.guild.name} Movie List__`].concat(moviesMessageArray)
		await splitSend(interaction, replyArray, { edit: true })
		return
	},
};