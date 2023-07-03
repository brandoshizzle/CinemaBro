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

		const { movies, error } = await getGuildMovies(interaction.guild, 'rating')

		if (error) {
			return logError(interaction, error)
		}

		const { statsMessage } = await guildStats(interaction, movies)

		return interaction.reply(statsMessage);
	},
};