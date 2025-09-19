const { handle } = require('@hono/node-server/vercel');
const app = require('../backend/hono.js').default;

module.exports = handle(app);