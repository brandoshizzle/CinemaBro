require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
	console.error('❌ MONGODB_URI environment variable is not set!');
	console.error('Please set MONGODB_URI before starting the container.');
	console.error('Example: mongodb+srv://username:password@cluster.mongodb.net/cinemabro');
	process.exit(1);
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