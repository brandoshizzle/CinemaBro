const random = require("../util/random")

const affirmations = [
	'Sick',
	'No prob',
	'Sure thing',
	'Can do',
	'Absolutely',
	'Great choice',
	'Tubular',
	'No problem',
	'No sweat',
]

const puncuation = [
	'.',
	'!',
	",",
]

function affirmation () {
	return random(affirmations) + random(puncuation)
}

module.exports = affirmation