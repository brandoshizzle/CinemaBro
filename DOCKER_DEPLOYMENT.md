# CinemaBro - Docker Deployment Guide

## Quick Start with Docker Compose

### 1. Setup Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- Discord bot token, client ID, and guild ID
- OMDB API key
- MongoDB Atlas connection string (see MongoDB Atlas setup below)

### 2. Build and Run

```bash
# Build the image and start services
docker-compose up -d

# View logs
docker-compose logs -f cinemabro

# Stop services
docker-compose down
```

### 3. Verify It's Running

```bash
# Check container status
docker-compose ps

# Test the bot in Discord (invoke a command)
```

---

## Home Server Deployment

### Setup Instructions

#### 1. Install Docker and Docker Compose on your home server

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git

# Add your user to docker group (optional, for running without sudo)
sudo usermod -aG docker $USER
```

#### 2. Clone the repository

```bash
sudo mkdir -p /opt/cinemabro
sudo chown $USER:$USER /opt/cinemabro
cd /opt/cinemabro
git clone --branch main https://github.com/brandoshizzle/CinemaBro.git .
```

#### 3. Setup MongoDB Atlas (Free Tier Available)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new project (e.g., "CinemaBro")
4. Create a cluster (free tier available):
   - Choose "M0 Sandbox" (free)
   - Select your preferred region (close to your location for lower latency)
   - 5lick "Create"
5. Wait for cluster to be ready (~10 minutes)
6. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password
   - 6et privileges to "Atlast admin" or "Read and write to any database"
   - Click "Add User"
7. Allow network access:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (or add your home server IP for better security)
   - Click "Confirm"
8. Get your connection string:
   - Go to "Database" → Click "Connect" on your cluster
   - Select "Drivers"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cinemabro?retryWrites=true&w=majority`)
   - Replace `username`, `password`, and database name as needed

#### 4. Setup environment file

```bash
cp .env.example .env
# Edit with your MongoDB Atlas connection string and Discord credentials
nano .env
```

Example `.env` content:
```
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
OMDB_KEY=your_omdb_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cinemabro?retryWrites=true&w=majority
NODE_ENV=production
```

#### 4. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Create a new token with `repo` and `workflow` scopes
3. Keep this token secure - you'll use it for docker login

#### 5. Login to GitHub Container Registry

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

#### 7. Setup webhook server (for auto-deployment on GitHub push)

**Option A: Using systemd service (recommended)**

Create `/etc/systemd/system/cinemabro-webhook.service`:

```ini
[Unit]
Description=CinemaBro GitHub Webhook Server
After=network.target

[Service]
Type=simple
User=cinemabro
WorkingDirectory=/opt/cinemabro
ExecStart=/usr/bin/node /opt/cinemabro/scripts/webhook-server.js
Restart=always
RestartSec=10
Environment="WEBHOOK_PORT=3001"
Environment="WEBHOOK_SECRET=your_github_webhook_secret"
Environment="DEPLOYMENT_DIR=/opt/cinemabro"

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cinemabro-webhook
sudo systemctl start cinemabro-webhook
sudo systemctl status cinemabro-webhook
```

**Option B: Using cron job (simpler, polls less frequently)**

Add to crontab:

```bash
0 */4 * * * cd /opt/cinemabro && git fetch origin && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && docker-compose pull && docker-compose up -d
```

#### 8. Setup GitHub Webhook (if using webhook server)

1. Go to your repository Settings → Webhooks → Add webhook
2. **Payload URL**: `http://your-home-server-ip:3001/deploy`
3. **Content type**: `application/json`
4. **Secret**: Use the same value as `WEBHOOK_SECRET` in systemd service
5. **Events**: Select "Push events"
6. **Active**: ✅ Checked

---

## MongoDB Atlas & Database Migration from Supabase

### 1. Export data from Supabase

```bash
# Export existing data (if any)
npx supabase db pull
```

### 2. Update database.js

You'll need to update your code to use MongoDB instead of Supabase. The MongoDB Atlas connection is handled via the `MONGODB_URI` environment variable.

**Option A: Using Mongoose (recommended)**

```bash
npm install mongoose
```

Then create a new `mongo-db.js`:

```javascript
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

module.exports = mongoose;
```

**Option B: Using MongoDB native driver**

```bash
npm install mongodb
```

### 3. Update config.json usage

Replace hardcoded `config.json` with environment variables throughout the codebase.

### 4. Update client.js and other modules

Change:
```javascript
const { token } = require('./config.json');
```

To:
```javascript
const token = process.env.DISCORD_TOKEN;
```

### 5. Test MongoDB Atlas connection

```bash
# Verify your MONGODB_URI in .env is correct
npm install
docker-compose up -d
docker-compose logs -f cinemabro
```

Look for "Connected to MongoDB Atlas" in the logs to confirm the connection works.

---

## Maintenance

### View logs

```bash
docker-compose logs -f cinemabro
```

### Backup MongoDB Atlas data

MongoDB Atlas provides built-in automated backups on free tier. You can also:

1. Enable automatic backups in MongoDB Atlas dashboard (Backup section)
2. Use MongoDB's built-in tools for manual backup:
   ```bash
   # Export data locally
   mongodump --uri "$MONGODB_URI" --out ./backup
   ```

### Update the application

Just push to `main` branch - it will automatically deploy if webhook server is running.

```bash
# Manual deployment if needed
cd /opt/cinemabro
git pull origin main
docker-compose pull
docker-compose up -d
```

### Stop services

```bash
cd /opt/cinemabro
docker-compose down
```

---

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs cinemabro
```

**MongoDB Atlas connection issues:**
- Verify `MONGODB_URI` is correct in `.env` file
- Check that your home server IP is whitelisted in MongoDB Atlas Network Access settings
- Ensure the database user has correct credentials in MongoDB Atlas Database Access
- Test connection string locally: `npm install mongodb && node -e "const MongoClient = require('mongodb').MongoClient; MongoClient.connect(process.env.MONGODB_URI).then(client => { console.log('Connected!'); client.close(); }).catch(console.error)"`

**Webhook not triggering:**
- Check webhook delivery in GitHub repo settings
- Verify firewall allows traffic to webhook port
- Check logs: `sudo journalctl -u cinemabro-webhook -f`

---

## Next Steps

1. **Setup MongoDB Atlas** (completed above)
2. **Update database code** to use MongoDB instead of Supabase
3. **Migrate existing data** if you have any in Supabase
4. **Test thoroughly** in your dev environment before deploying
4. **Configure backups** for your MongoDB data
