const { SlashCommandBuilder } = require('discord.js');
const logError = require('../../util/logError');
const getGuildMovies = require('../../util/getGuildMovies');
const guildStats = require('../../util/guildStats');
const splitSend = require('../../util/splitSend');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription("Get stats about your movie list.")
		.setDMPermission(false),
	async execute (interaction) {
		await interaction.deferReply()
		const { movies, moviesMessageArray, error } = await getGuildMovies(interaction.guild, 'rating')

		if (error) {
			return logError(interaction, error)
		}

		const { statsMessage } = await guildStats(interaction, movies)

		let replyArray = ["**.oOo.oOo.oOo.oOo.   WELCOME TO MANN CINEMAS   .oOo.oOo.oOo.oOo.**\nType '/' into the message bar to see what I can do./n"]
		replyArray = replyArray.concat(moviesMessageArray)
		await splitSend(interaction, replyArray, { edit: true })
		await interaction.channel.send(statsMessage);
	},
};