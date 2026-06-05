#!/usr/bin/env node
/**
 * Simple webhook server for receiving GitHub deployment triggers
 * Run this as a systemd service on your home server
 * 
 * Usage: node scripts/webhook-server.js
 * 
 * Environment variables:
 * - WEBHOOK_PORT: Port to listen on (default: 3001)
 * - WEBHOOK_SECRET: GitHub webhook secret for validation
 * - DEPLOYMENT_DIR: Directory where CinemaBro is deployed
 */

const http = require('http');
const { execSync } = require('child_process');
const crypto = require('crypto');

const PORT = process.env.WEBHOOK_PORT || 3001;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DEPLOYMENT_DIR = process.env.DEPLOYMENT_DIR || '/opt/cinemabro';
const DEPLOY_SCRIPT = `${DEPLOYMENT_DIR}/scripts/deploy.sh`;

function verifySignature (req, body) {
	if (!WEBHOOK_SECRET) {
		console.warn('WARNING: WEBHOOK_SECRET not set. Skipping signature verification.');
		return true;
	}

	const signature = req.headers['x-hub-signature-256'];
	if (!signature) {
		return false;
	}

	const hash = crypto.createHmac('sha256', WEBHOOK_SECRET)
		.update(body)
		.digest('hex');

	return `sha256=${hash}` === signature;
}

const server = http.createServer((req, res) => {
	if (req.method === 'POST' && req.url === '/deploy') {
		let body = '';

		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', () => {
			// Verify GitHub webhook signature
			if (!verifySignature(req, body)) {
				res.writeHead(401, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Unauthorized' }));
				return;
			}

			try {
				const payload = JSON.parse(body);

				// Only deploy on push to main branch
				if (payload.ref !== 'refs/heads/main') {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ message: 'Ignoring non-main branch' }));
					return;
				}

				console.log(`[${new Date().toISOString()}] Deployment triggered by ${payload.pusher.name}`);

				// Execute deploy script in background
				execSync(`chmod +x ${DEPLOY_SCRIPT}`);
				execSync(`${DEPLOY_SCRIPT}`, {
					stdio: 'inherit',
					env: { ...process.env, DEPLOYMENT_DIR }
				});

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ message: 'Deployment completed' }));
			} catch (error) {
				console.error('Deployment failed:', error.message);
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Deployment failed', details: error.message }));
			}
		});
	} else {
		res.writeHead(404);
		res.end();
	}
});

server.listen(PORT, () => {
	console.log(`Webhook server listening on port ${PORT}`);
	console.log('Waiting for GitHub webhooks...');
});
