const { SlashCommandBuilder } = require('discord.js');
const logError = require('../../util/logError');
const getGuildMovies = require('../../util/getGuildMovies');
const guildStats = require('../../util/guildStats');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription("Get stats about your movie list.")
		.setDMPermission(false),
	async execute (interaction) {
		await interaction.deferReply()
		const { movies, error } = await getGuildMovies(interaction.guild.id, 'rating')

		if (error) {
			return logError(interaction, error)
		}

		await interaction.editReply("**.oOo.oOo.oOo.oOo.   WELCOME TO MANN CINEMAS   .oOo.oOo.oOo.oOo.**\nType a / into the message bar to see all my commands!")
		return interaction.reply(replyString);
	},
};