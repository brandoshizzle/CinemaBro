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

		const stats = await guildStats(movies)
		const replyArray = [
			`${interaction.guild.name} Fast Facts`,
			`**Average Rating:** ${stats.mean}`,
			`**Highest Rated Movie:** ${stats.max.name} with ${stats.max.rating}`,
			`**Lowest Rated Movie:** ${stats.min.name} with ${stats.min.rating}`,
			`**Median Rating:** ${stats.median.rating} (${stats.median.name})`,
			`**Highest Average Rating:** ${stats.maxAverage.average} (${stats.maxAverage.name})`,
			`**Lowest Average Rating:** ${stats.minAverage.average} (${stats.minAverage.name})`,
		]
		const replyString = replyArray.join('\n')
		return interaction.reply(replyString);
	},
};