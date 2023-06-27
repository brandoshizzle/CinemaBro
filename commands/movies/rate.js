const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const movieAutoComplete = require('../../util/movieAutoComplete');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rate')
		.setDescription('Rate a movie in the database')
		.addStringOption(option =>
			option
				.setName('rating')
				.setDescription('Rating from 0 to 100')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to rate')
				.setRequired(false)
				.setAutocomplete(true)
		),
	async autocomplete (interaction) {
		await movieAutoComplete(interaction)
	},
	async execute (interaction) {
		const passedMovieId = interaction.options.getString('movie');
		const rating = interaction.options.getString('rating');
		let movie

		if (!passedMovieId) {
			// No movie proivded, get latest from guild
			const { data, error } = await supabase
				.from('guilds')
				.select(`
					movies!latest_movie(
						id,
						name
					)
				`)
				.eq('id', interaction.guild.id)

			if (error) {
				return logError(interaction, error)
			}

			if (!data || data?.length === 0) {
				return interaction.reply("Your guild isn't registered - !");
			}

			movie = data[0].movies

		} else {
			// Movie proivded, check if ID matches up
			const movieIdNumber = isNaN(passedMovieId) ? null : Number(passedMovieId)
			if (movieIdNumber === null) {
				return interaction.reply(`${passedMovieId} wasn't not found in the database - use /add to add it!`)
			}

			// Find movie by id
			const { data, error } = await supabase
				.from('movies')
				.select('id, name')
				.eq('id', movieIdNumber)

			if (!data || error) {
				return interaction.reply(`${passedMovieId} wasn't found in the database - use /add to add it!`)
			}

			movie = data[0]

		}

		const { error: ratingError } = await supabase
			.from('ratings')
			.upsert({ user_id: interaction.user.id, movie_id: movie.id, rating: rating })
			.select()

		if (ratingError) {
			return logError(interaction, ratingError)
		}

		return interaction.reply(`<@${interaction.user.id}> just gave ${movie.name} a **${rating}**.`)

	},
};