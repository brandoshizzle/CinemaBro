const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const movieAutoComplete = require('../../util/movieAutoComplete');
const getUsername = require('../../util/getUsername');
const getMovieRating = require('../../util/getMovieRating');

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

		// Movie proivded, check if ID matches up
		const movieIdNumber = isNaN(passedMovieId) ? null : Number(passedMovieId)

		// Find movie by id
		const { data: movie, error } = await supabase
			.from('movies')
			.select(`
				*,
				ratings (
					*
				)
			`)
			.eq('id', movieIdNumber)
			.single()

		if (error) {
			return logError(interaction, error)
		}

		// Get usernames
		movie.ratings = await Promise.all(movie.ratings.map(async (rating) => ({
			...rating,
			username: await getUsername(rating.user_id)
		})))

		console.log(movie.ratings)

		const movieEmbed = {
			title: movie.name,
			author: {
				name: interaction.guild.name
			},
			description: `${interaction.guild.name} has the following information for ${movie.name}`,
			fields: [
				{
					name: 'Rating',
					value: getMovieRating(movie.ratings)
				},
				{
					name: 'Ratings',
					value: movie.ratings.map(rating => `**${rating.rating}** - ${rating.username}`).join('\n')
				},
			]
		}

		return interaction.reply({ embeds: [movieEmbed] })

	},
};