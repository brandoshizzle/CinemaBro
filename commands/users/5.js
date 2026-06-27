const { SlashCommandBuilder } = require('discord.js');
const { Ratings } = require('../../schema/schema')
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('5')
		.setDescription('The top and bottom 5 movies for a user.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user you want the list for.')
		),
	async execute (interaction) {

		let user = interaction.options.getUser('user');

		if (!user) {
			user = interaction.user
		}

		// Get movies
		let data, error
		try {
			console.log('Fetching ratings for user ID:', user.id)
			data = await Ratings.find({ '_id.user_id': user.id })
				.populate('_id.movie_id', 'id name year')
				.sort({ rating: -1 })
				.lean()
			data = data.map(rating => {
				rating.movie = rating._id.movie_id;
				delete rating._id.movie_id;
				return rating;
			});
			// console.log('Ratings data:', data)
		} catch (err) {
			console.error('Error fetching ratings from MongoDB:', err)
			error = 'Failed to fetch ratings: ' + err.message
		}

		if (error) {
			return logError(interaction, error)
		}

		const top5 = data.slice(0, 5)
		const bottom5 = data.slice(data.length - 5)

		let replyString = `${user.username}'s Hot & Not List\n`
		replyString += '**Top 5:**\n'
		replyString += top5.map(rating => `**${rating.rating}** - ${rating.movie.name}`).join('\n')
		replyString += '\n**Bottom 5:**\n'
		replyString += bottom5.map(rating => `**${rating.rating}** - ${rating.movie.name}`).join('\n')
		return interaction.reply(replyString)
	},
};