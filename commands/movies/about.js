const { SlashCommandBuilder } = require('discord.js');
const { Movies, Ratings } = require('../../schema/schema')
const logError = require('../../util/logError');
const movieAutoComplete = require('../../util/movieAutoComplete');
const getMovieRating = require('../../util/getMovieRating');
const getGuildMembers = require('../../functions/getGuildMembers');
// const fuzzyMatchGuildMovie = require('../../util/fuzzyMatchGuildMovie');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Learn about a movie.')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want info about')
				.setRequired(true)
				.setAutocomplete(true)
		),
	async autocomplete (interaction) {
		await movieAutoComplete(interaction)
	},
	async execute (interaction) {

		const passedMovieId = interaction.options.getString('movie');
		const members = await getGuildMembers(interaction.guild.id)
		// Movie provided, check if ID matches up
		// const movieId = passedMovieId ? await fuzzyMatchGuildMovie(passedMovieId, interaction.guild) : passedMovieId
		const movieId = passedMovieId
		let movie, ratings, error
		try {
			movie = await Movies.findOne(
				{ _id: movieId }
			).lean()
			ratings = await Ratings.find({ '_id.movie_id': movieId, '_id.user_id': { $in: members.map(m => m.id) } }).lean()

			movie.ratings = ratings
		} catch (err) {
			console.error('Error fetching movie from MongoDB:', err)
			error = 'Failed to fetch movie: ' + err.message
		}

		if (error) {
			return logError(interaction, error)
		}

		if (movie?.ratings && movie.ratings.length > 0) {
			movie.ratings = movie.ratings.filter(r => members.map(m => m.id).includes(r._id.user_id)).map(r => ({
				...r,
				user_name: members.find(m => m.id === r._id.user_id).name
			}))
		}

		const movieEmbed = {
			title: movie.name,
			author: {
				name: interaction.guild.name
			},
			description: "",
			fields: [
				{
					name: 'Rating',
					value: movie.ratings.length > 0 ? getMovieRating(movie.ratings).toFixed(1) : 0
				},
				{
					name: 'Ratings',
					value: movie.ratings.length > 0 ? movie.ratings.map(rating => `**${rating.rating}** - ${rating.user_name}`).join('\n') : "None"
				},
			]
		}

		return interaction.reply({ embeds: [movieEmbed] })

	},
};