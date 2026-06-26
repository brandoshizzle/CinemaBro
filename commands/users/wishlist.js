const { SlashCommandBuilder } = require('discord.js');
const { Users } = require('../../schema/schema')
const logError = require('../../util/logError');
const splitSend = require('../../util/splitSend')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wishlist')
		.setDescription('Retrieve your wishlist'),
	async execute (interaction) {
		await interaction.reply({ content: 'Hell yeah bro, grabbing your wishlist for ya.', ephemeral: true })
		// Get movies
		let data, error
		try {
			data = await Users.findOne({ id: interaction.user.id }, { wishlist: 1 }).lean()
		} catch (err) {
			console.error('Error fetching user from MongoDB:', err)
			error = 'Failed to fetch user: ' + err.message
		}

		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		if (!data || !data.wishlist || data.wishlist.length === 0) {
			return logError(interaction, 'Your wishlist is empty.', { ephemeral: true, edit: true })
		}

		let replyArray = [`**${interaction.user.username}'s Wishlist**`]
		data.wishlist.forEach(movieName => replyArray.push(movieName))
		await splitSend(interaction, replyArray, true)
		return interaction.editReply({ content: 'Check your DMs - I just sent you your wishlist.', ephemeral: true })
	},
};