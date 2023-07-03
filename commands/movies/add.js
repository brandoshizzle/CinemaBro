const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const affirmation = require('../../data/affirmations');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a movie to the database')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to add')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('rating')
				.setDescription('Your rating for the movie')),
	async execute (interaction) {
		const movie = interaction.options.getString('movie');
		const rating = interaction.options.getString('rating');
		const guildOrUser = {
			id: interaction?.guild?.id ?? interaction.user.id,
			name: interaction?.guild?.name ?? interaction.user.username
		}

		// Add movie to database
		const { data: newMovies, error: movieError } = await supabase
			.from('movies')
			.upsert({ name: movie }, { onConflict: 'name' })
			.select()

		if (movieError) {
			return logError(interaction, movieError)
		}

		const newMovie = newMovies[0]

		// Update Guild table with latest movie
		if (interaction?.guild?.id) {
			const { error: guildError } = await supabase
				.from('guilds')
				.upsert({ id: guildOrUser.id, name: guildOrUser.name, latest_movie: Number(newMovie.id) })
				.select()

			if (guildError) {
				return logError(interaction, guildError)
			}

			// Update Guild Movies table
			const { error: guildMoviesError } = await supabase
				.from('guild_movies')
				.upsert({ movie_id: newMovie.id, guild_id: guildOrUser.id })
				.select()

			if (guildMoviesError) {
				return logError(interaction, guildMoviesError)
			}
		} else {
			// Update user table with latest_movie
			const { error: userTableError } = await supabase
				.from('users')
				.upsert({ id: guildOrUser.id, latest_movie: Number(newMovie.id) })
				.select()

			if (userTableError) {
				return logError(interaction, userTableError)
			}
		}

		// Add rating if applicable
		if (rating) {
			const { error: ratingError } = await supabase
				.from('ratings')
				.upsert({ user_id: interaction.user.id, movie_id: movie.id, rating: rating })
				.select()

			if (ratingError) {
				return logError(interaction, ratingError)
			}
		}

		return interaction.reply(`${affirmation()} I added ${newMovie.name} to ${guildOrUser.name}.\n You can now rate it using /rate!`);
	},
};