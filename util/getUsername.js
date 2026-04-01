const client = require('../client')

async function getUsername (guildID, userID) {
	if (!userID) return "Mystery User"
	const guildData = client.guilds.cache.get(guildID)
	try {
		const member = await guildData.members.fetch(userID)
		return member.displayName
	} catch (e) {
		return "Mystery User"
	}
}

module.exports = getUsername