require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
	throw new Error('MONGODB_URI environment variable is not set');
}

// Connect to MongoDB
mongoose.connect(mongoUri)
	.catch((error) => {
		console.error('✗ MongoDB connection error:', error.message);
		process.exit(1);
	});

const db = mongoose.connection;

db.once('open', async () => {
	console.log('✓ Connected to MongoDB Atlas');
	try {
		const ratingsCount = await db.collection('ratings').countDocuments();
		console.log('Ratings count:', ratingsCount);
	} catch (error) {
		console.error('Error counting ratings:', error.message);
	}
});

db.on('error', (error) => {
	console.error('MongoDB connection error:', error);
});

db.on('disconnected', () => {
	console.warn('⚠ MongoDB disconnected');
});

module.exports = mongoose;