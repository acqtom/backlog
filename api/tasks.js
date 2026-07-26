const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const APP_PASSWORD = process.env.APP_PASSWORD || "backlog123";
const BOARD_KEY = "backlog:board";
const DEFAULT_BOARD = { tasks: [], clients: ["Adriel", "Alex"], yearlyGoals: [], updatedAt: 0 };

module.exports = async (req, res) => {
  if (req.headers["x-app-password"] !== APP_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method === "GET") {
    const board = (await redis.get(BOARD_KEY)) || DEFAULT_BOARD;
    res.status(200).json(board);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const board = {
      tasks: Array.isArray(body.tasks) ? body.tasks : [],
      clients: Array.isArray(body.clients) && body.clients.length ? body.clients : DEFAULT_BOARD.clients,
      yearlyGoals: Array.isArray(body.yearlyGoals) ? body.yearlyGoals : [],
      updatedAt: Date.now(),
    };
    await redis.set(BOARD_KEY, board);
    res.status(200).json(board);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
