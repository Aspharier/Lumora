const app = require("../expressApp");
const serverless = require("serverless-http");

module.exports = serverless(app);
