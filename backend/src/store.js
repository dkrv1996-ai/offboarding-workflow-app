// Temporary in-memory store (later we will use SQLite/Prisma)
module.exports = {
  requests: new Map(), // requestId -> requestObject
  tokens: new Map(),   // token -> { requestId, step, expiresAt, used }
};