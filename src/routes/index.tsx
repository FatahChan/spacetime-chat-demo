import { createFileRoute } from '@tanstack/react-router';
import { ClientOnly } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth, useAutoSignin } from 'react-oidc-context';
import { Button, Input } from '@base-ui/react';
import { tables, reducers } from '../module_bindings';
import {
  useSpacetimeDB,
  useReducer,
  useSpacetimeDBQuery,
} from 'spacetimedb/tanstack';

export const Route = createFileRoute('/')({
  component: () => (
    <ClientOnly
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      }
    >
      <ChatPage />
    </ClientOnly>
  ),
});

function ChatPage() {
  const auth = useAuth();
  useAutoSignin();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg text-red-600">Error: {auth.error.message}</p>
        <Button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => auth.signinRedirect()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg text-gray-600">Sign in with GitHub to chat</p>
        <Button
          className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
          onClick={() => auth.signinRedirect()}
        >
          Sign in with GitHub
        </Button>
      </div>
    );
  }

  return <ChatUI />;
}

function ChatUI() {
  const [text, setText] = useState('');
  const auth = useAuth();
  const conn = useSpacetimeDB();
  const { isActive: connected, identity: myIdentity } = conn;

  const [users] = useSpacetimeDBQuery(tables.user);
  const [messages] = useSpacetimeDBQuery(tables.message);
  const sendMessage = useReducer(reducers.sendMessage);

  const userMap = new Map(users.map(u => [u.identity.toHexString(), u.username]));
  const myIdentityHex = myIdentity?.toHexString();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !connected) return;
    sendMessage({ text: text.trim() });
    setText('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          Spacetime Chat
        </h1>
        <Button
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => auth.signoutRedirect()}
        >
          Sign out
        </Button>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden p-4">
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="mb-4 flex-1 overflow-y-auto rounded-lg border bg-white p-4">
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet. Say hello!</p>
            ) : (
              messages.map(msg => {
                const isMe = myIdentityHex && msg.senderId.toHexString() === myIdentityHex;
                const displayName = isMe ? 'You' : (userMap.get(msg.senderId.toHexString()) ?? 'Unknown');
                return (
                  <div
                    key={msg.id.toString()}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                        {displayName}
                      </span>
                      <p className={isMe ? 'text-white' : 'text-gray-700'}>{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={text}
            onValueChange={value => setText(value)}
            placeholder="Type a message..."
            disabled={!connected}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <Button
            type="submit"
            disabled={!connected || !text.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

