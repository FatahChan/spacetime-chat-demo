import { schema, table, t } from 'spacetimedb/server';
import { SenderError } from 'spacetimedb/server';

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

    ctx.db.message.insert({
      id: 0n,
      senderId: ctx.sender,
      text: trimmed,
      createdAt: ctx.timestamp,
    });
  }
);
