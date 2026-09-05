/**
 * Root Entrypoint Forwarder for Render.com and Node.js PaaS hosting.
 * Automatically forwards execution to the institutional backend server in backend/server.js.
 * This guarantees seamless deployment whether Render rootDir is configured as '.' or 'backend'.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") });
require("dotenv").config(); // fallback to root .env if present

require("./backend/server.js");
