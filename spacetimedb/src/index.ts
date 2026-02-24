import { schema, table, t } from 'spacetimedb/server';
import { SenderError } from 'spacetimedb/server';

const RATE_LIMIT_WINDOW_MICROS = 60_000_000n; // 60 seconds
const RATE_LIMIT_MAX_PER_WINDOW = 10;

const spacetimedb = schema({
  user: table(
    {
      name: 'user',
      public: true,
    },
    {
      identity: t.identity().primaryKey(),
      username: t.string(),
    }
  ),
  message: table(
    {
      name: 'message',
      public: true,
      indexes: [
        {
          name: 'message_sender_id',
          algorithm: 'btree',
          columns: ['senderId'],
        },
      ],
    },
    {
      id: t.u64().primaryKey().autoInc(),
      senderId: t.identity(),
      text: t.string(),
      createdAt: t.timestamp(),
    }
  ),
  rateLimitTracker: table(
    {
      name: 'rate_limit_tracker',
      // private: clients don't need to subscribe
    },
    {
      identity: t.identity().primaryKey(),
      windowStart: t.timestamp(),
      count: t.u64(),
    }
  ),
});
export default spacetimedb;

export const init = spacetimedb.init(_ctx => {
  // Called when the module is initially published
});

export const onConnect = spacetimedb.clientConnected(ctx => {
  const jwt = ctx.senderAuth.jwt;
  if (jwt == null) {
    throw new SenderError('Unauthorized: JWT is required to connect');
  }

  const username =
    (jwt.fullPayload['preferred_username'] as string) ??
    (jwt.fullPayload['name'] as string) ??
    ctx.sender.toHexString().slice(0, 12);

  const existing = ctx.db.user.identity.find(ctx.sender);
  if (existing) {
    ctx.db.user.identity.update({ ...existing, username });
  } else {
    ctx.db.user.insert({ identity: ctx.sender, username });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected(_ctx => {
  // Called every time a client disconnects
});

const MAX_MESSAGE_LENGTH = 2000;

export const send_message = spacetimedb.reducer(
  { text: t.string() },
  (ctx, { text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new SenderError('Message text cannot be empty');
    if (trimmed.length > MAX_MESSAGE_LENGTH)
      throw new SenderError(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);

    const now = ctx.timestamp.microsSinceUnixEpoch;
    const existing = ctx.db.rateLimitTracker.identity.find(ctx.sender);
    if (existing) {
      const elapsed = now - existing.windowStart.microsSinceUnixEpoch;
      if (elapsed < RATE_LIMIT_WINDOW_MICROS) {
        if (existing.count >= RATE_LIMIT_MAX_PER_WINDOW) {
          throw new SenderError(
            `Rate limit exceeded. Max ${RATE_LIMIT_MAX_PER_WINDOW} messages per minute. Try again later.`
          );
        }
        ctx.db.rateLimitTracker.identity.update({
          ...existing,
          count: existing.count + 1n,
        });
      } else {
        ctx.db.rateLimitTracker.identity.update({
          ...existing,
          windowStart: ctx.timestamp,
          count: 1n,
        });
      }
    } else {
      ctx.db.rateLimitTracker.insert({
        identity: ctx.sender,
        windowStart: ctx.timestamp,
        count: 1n,
      });
    }

    ctx.db.message.insert({
      id: 0n,
      senderId: ctx.sender,
      text: trimmed,
      createdAt: ctx.timestamp,
    });
  }
);
