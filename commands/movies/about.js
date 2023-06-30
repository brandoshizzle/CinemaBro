const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const movieAutoComplete = require('../../util/movieAutoComplete');
const getMovieRating = require('../../util/getMovieRating');
const getGuildMembers = require('../../util/getGuildMembers');
const fuzzyMatchGuildMovie = require('../../util/fuzzyMatchGuildMovie');

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

		// Movie proivded, check if ID matches up
		const movieIdNumber = isNaN(passedMovieId) ? await fuzzyMatchGuildMovie(passedMovieId, interaction.guild) : Number(passedMovieId)

		// Find movie by id
		const { data: movie, error } = await supabase
			.from('movies')
			.select(`
				*,
				ratings (
					rating,
					user_id
				)
			`)
			.eq('id', movieIdNumber)
			.single()

		if (error) {
			return logError(interaction, error)
		}

		if (movie?.ratings && movie.ratings.length > 0) {
			movie.ratings = movie.ratings.filter(r => members.map(m => m.id).includes(r.user_id)).map(r => ({
				...r,
				user_name: members.find(m => m.id === r.user_id).name
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
					value: movie.ratings.length > 0 ? getMovieRating(movie.ratings) : 0
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