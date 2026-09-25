
function logError (interaction, error, options = { edit: false, ephemeral: false }) {
	if (error) {
		console.log(error)
	}
	const message = error?.message || error
	const content = `Aw snap bro, I ran into an error: ${message} :(`
	if (options?.edit) {
		return interaction.editReply({ content })
	}
	return interaction.reply({ content, ephemeral: options?.ephemeral || false })

}

module.exports = logError