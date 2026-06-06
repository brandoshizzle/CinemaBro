const { SlashCommandBuilder } = require('discord.js');
const { Users } = require('../../schema/schema')
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wish')
		.setDescription('Add a movie to your wishlist')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to add')
				.setRequired(true)
		),
	async execute (interaction) {

		const passedMovieTitle = interaction.options.getString('movie');


		// Get user wishlist
		let data, error
		try {
			data = await Users.findOne({ id: interaction.user.id }).lean()
		} catch (err) {
			console.error('Error fetching user from MongoDB:', err)
			error = 'Failed to fetch user: ' + err.message
		}

		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		let user = {}
		if (data) {
			user = data
		} else {
			user = { id: interaction.user.id, wishlist: [] }
		}

		user.wishlist.push(passedMovieTitle)

		// Write back to db
		let writeError
		try {
			await Users.updateOne({ id: interaction.user.id }, user, { upsert: true })
		} catch (err) {
			console.error('Error writing user to MongoDB:', err)
			writeError = 'Failed to write user: ' + err.message
		}

		if (writeError) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		return interaction.reply({ content: `Tubular, I added ${passedMovieTitle} to your wishlist.`, ephemeral: true })
	},
};