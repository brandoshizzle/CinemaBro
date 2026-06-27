const { SlashCommandBuilder } = require('discord.js');
const { Ratings } = require('../../schema/schema')
const logError = require('../../util/logError');
const splitSend = require('../../util/splitSend')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mylist')
		.setDescription('Retrieve your movie list'),
	async execute (interaction) {
		await interaction.reply({ content: 'No prob, grabbing your movie list for ya.', ephemeral: true })
		console.log(`User ${interaction.user.tag} (${interaction.user.id}) requested their movie list.`)
		// Get ratings for user
		let data, error
		try {
			data = await Ratings.find({ '_id.user_id': interaction.user.id })
				// Populate movie details based on  _id.movie_id, sort by rating descending, and convert to plain JS object
				.populate({ path: '_id.movie_id', model: 'Movies', select: 'name year' })
				.sort({ rating: -1 })
				.lean()
		} catch (err) {
			console.error('Error fetching ratings from MongoDB:', err)
			error = 'Failed to fetch ratings: ' + err.message
		}

		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}
		let replyArray = ['Coming in hot with your full movie list:']
		data.forEach(rating => replyArray.push(`**${rating.rating}** ${rating._id.movie_id.name} ${rating?._id?.movie_id?.year ? `(${rating?._id?.movie_id?.year})` : ''}`))
		await splitSend(interaction, replyArray, { dm: true })
		return interaction.editReply({ content: 'Check your DMs - I just sent you your list.', ephemeral: true })
	},
};