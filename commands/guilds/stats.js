const { SlashCommandBuilder } = require('discord.js');
const logError = require('../../util/logError');
const getGuildMovies = require('../../util/getGuildMovies');
const guildStats = require('../../util/guildStats');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription("Get stats about your movie list.")
		.setDMPermission(false),
	async execute (interaction) {
		await interaction.deferReply()

		const { movies, error } = await getGuildMovies(interaction.guild, 'rating')

		if (error) {
			return logError(interaction, error, { edit: true })
		}

		const { statsMessage, error: statsError } = await guildStats(interaction, movies)

		if (statsError) {
			return logError(interaction, statsError, { edit: true })
		}

		return interaction.editReply(statsMessage);
	},
};