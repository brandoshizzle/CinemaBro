const client = require('../client')

async function getUsername (userID) {
	const user = await client.users.fetch(userID)
	return user?.username || "Mystery User"
}

module.exports = getUsername