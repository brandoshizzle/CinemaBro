
async function splitSend (interaction, textArray, dm = false) {
	// Add from text array until 2000 char limit is reached
	let replyString = ""
	for (let i = 0; i < textArray.length; i++) {
		const prevString = replyString
		replyString += textArray[i] + "\n"

		if (replyString.length > 1999) {
			// Send previous string
			if (dm) {
				await interaction.user.send(prevString)
			} else {
				await interaction.reply(prevString)
			}
			// new replyString for next message
			replyString = textArray[i] + "\n"
		}
	}
	if (dm) {
		await interaction.user.send(replyString)
	} else {
		await interaction.reply(replyString)
	}

	return
}

module.exports = splitSend