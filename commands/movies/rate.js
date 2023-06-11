const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const getAllMovies = require('../../util/getAllMovies');

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
				.setDescription('The movie you want to add')
				.setRequired(false)
				.setAutocomplete(true)
		),
	async autocomplete (interaction) {
		const focusedValue = interaction.options.getFocused();
		const { movies } = await getAllMovies()
		const filtered = movies.filter(movie => movie.name.toLowerCase().includes(focusedValue.toLowerCase()));
		await interaction.respond(
			filtered.map(movie => ({ name: movie.name, value: movie.id })),
		);
	},
	async execute (interaction) {
		const passedMovieId = interaction.options.getString('movie');
		const rating = interaction.options.getString('rating');
		let movie

		// Ensure user is registered
		const { error: userError } = await supabase
			.from('users')
			.upsert({ id: interaction.user.id, username: interaction.user.username })

		if (userError) {
			console.log(userError)
			return interaction.reply('Issue registering user to database. Please try again.')
		}

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
				console.log(error)
				return interaction.reply("Issue getting the latest movie from the database.");
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

		console.log(movie)

		const { data: ratingData, error: ratingError } = await supabase
			.from('ratings')
			.upsert({ user_id: interaction.user.id, movie_id: movie.id, rating: rating })
			.select()

		if (ratingError) {
			console.log(ratingError)
			return interaction.reply('Issue sending rating to database. Please try again.')
		}

		console.log(ratingData)
		return interaction.reply(`<@${interaction.user.id}> just gave ${movie.name} a medium ${rating}.`)

	},
};