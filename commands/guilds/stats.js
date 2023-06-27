const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const getGuildMovies = require('../../util/getGuildMovies');
const guildStats = require('../../util/guildStats');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription("Get stats about your movie list.")
		.setDMPermission(false),
	async execute (interaction) {

		const { movies, error } = await getGuildMovies(interaction.guild.id, 'rating')

		if (error) {
			return logError(interaction, error)
		}

		const stats = guildStats(movies)
		const replyArray = [
			`${interaction.guild.name} Fast Facts`,
			`**Average Movie:** ${stats.mean}`
		]
		const replyString = replyArray.join('\n')
		return interaction.reply(replyString);
	},
};