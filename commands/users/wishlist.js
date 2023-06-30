const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const splitSend = require('../../util/splitSend')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wishlist')
		.setDescription('Retrieve your wishlist'),
	async execute (interaction) {
		await interaction.reply({ content: 'Hell yeah bro, grabbing your wishlist for ya.', ephemeral: true })
		// Get movies
		const { data, error } = await supabase
			.from('users')
			.select('wishlist')
			.eq('id', interaction.user.id)

		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		if (!data || data?.length === 0) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		let replyArray = [`**${interaction.user.username}'s Wishlist**`]
		data[0].wishlist.forEach(movieName => replyArray.push(movieName))
		await splitSend(interaction, replyArray, true)
		return interaction.editReply({ content: 'Check your DMs - I just sent you your wishlist.', ephemeral: true })
	},
};