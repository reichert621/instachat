import type {NextPage} from 'next';
import Head from 'next/head';
import {useRouter} from 'next/router';
import React from 'react';
import {XIcon} from '@heroicons/react/outline';
import dayjs from 'dayjs';
import {useQuery, transact, tx, id} from '@instantdb/react';

import toaster from '@/utils/toaster';
import Modal from '@/components/Modal';
import {LightningBoltIcon} from '@heroicons/react/solid';

const CACHE_KEY = '__instachat_id';

const register = (w: Window, userId: string) => {
  try {
    w.localStorage.setItem(CACHE_KEY, userId);
  } catch (err) {
    //
  } finally {
    w.document.cookie = `${CACHE_KEY}=${userId}`;
  }
};

const cookies = (w: Window): Record<string, string> => {
  const str = w.document.cookie || '';
  const chunks = str.split('; ');

  return chunks.reduce((acc, chunk) => {
    const [key, value] = chunk.split('=');

    return {...acc, [key]: value};
  }, {});
};

const fetchCurrentUserId = (w: Window) => {
  try {
    const mappings = cookies(w);

    return mappings[CACHE_KEY];
  } catch (err) {
    //
  } finally {
    return w.localStorage.getItem(CACHE_KEY);
  }
};

type User = {
  id: string;
  name: string;
  created_at: number;
};

type Message = {
  id: string;
  body: string;
  timestamp: number;
  user: User;
};

type Channel = {
  id: string;
  name: string;
  messages: Array<Message>;
};

const RegisterModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (app: any) => void;
}) => {
  // NB: we fetch all users to validate that the current user doesn't create
  // a conflicting username... not sure what the ideal way to handle this is
  const {users} = useQuery({users: {}});
  const [username, setNewUsername] = React.useState('');
  const [isCreating, setCreatingState] = React.useState(false);

  const handleCreateNewApp = async (e: any) => {
    e && e.preventDefault();

    if (!username || !username.trim().length) {
      return toaster.error('Please enter a username!');
    } else if (users.some((user: any) => user.name === username)) {
      return toaster.error('This username is taken :( please try another.');
    }
    try {
      setCreatingState(true);

      const user: User = {
        id: id(),
        name: username,
        created_at: Date.now(),
      };

      transact(tx.users[user.id].update(user));
      register(window, user.id);
      onSuccess(user);
      setNewUsername('');
    } catch (err: any) {
      const message = err.response.data.error || err.message || String(err);

      toaster.error(message);
    } finally {
      setCreatingState(false);
    }
  };

  return (
    <Modal className="max-w-md" isOpen={isOpen} onClose={onClose}>
      <div className="bg-gray-800 text-gray-100">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">
            Create a username
          </h2>
          <button
            className="text-gray-400 transition-colors hover:text-gray-100"
            onClick={onClose}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="px-4 py-6">
          <form onSubmit={handleCreateNewApp}>
            <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
              What would you like to be called?
            </label>
            <input
              className="mb-4 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none placeholder:text-gray-600 focus:border-gray-500 active:border-gray-600"
              placeholder="flying-potato-1337"
              value={username}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <button
              className={`${
                isCreating ? 'cursor-not-allowed opacity-60' : ''
              } w-full rounded border border-transparent bg-indigo-700 py-2 px-4 font-medium hover:bg-indigo-600 hover:text-white`}
              type="submit"
            >
              {isCreating ? (
                <span>Creating...</span>
              ) : (
                <span>Enter the chat</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

const InstaChat = () => {
  const router = useRouter();
  const channelName = (router.query.c ||
    router.query.cid ||
    router.query.channel) as string;
  const [text, setMessageText] = React.useState('');
  const scrollToRef = React.useRef<HTMLDivElement | null>(null);
  const textInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const {channels = []} = useQuery({channels: {}});
  const data = useQuery({
    users: {},
    channel: {
      messages: {user: {$: {is: '_users', cardinality: 'one'}}},
      $: {where: {name: channelName}, cardinality: 'one', is: 'channels'},
    },
  });
  const {users = [], channel} = data;
  const currentUserId = fetchCurrentUserId(window);
  const currentUser = users.find((u: any) => u.id === currentUserId) || null;
  const messages = channel?.messages || [];

  React.useEffect(() => {
    scrollToRef.current?.scrollIntoView();
    // TODO: should we do this?
    textInputRef.current?.focus();
  }, [messages.length]);

  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!currentUserId) {
      throw new Error('Not logged in!');
    }

    if (!text || !text.length) {
      return;
    }

    const messageId = id();

    transact([
      tx.messages[messageId].update({body: text, timestamp: Date.now()}),
      tx.channels[channel.id].link({messages: messageId}),
      tx.users[currentUserId].link({messages: messageId}),
    ]);

    setMessageText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative flex w-full flex-1 flex-col bg-black">
      <Head>
        <title>InstaChat</title>
      </Head>

      <aside className="fixed top-0 bottom-0 left-0 flex w-64 flex-col border-r border-transparent bg-gray-900 py-8 px-4">
        <div className="flex-1 space-y-2">
          {channels.map((ch: Channel) => {
            const isSelected = ch.name === channelName;

            return (
              <div key={ch.id}>
                <button
                  className={`${
                    isSelected
                      ? 'border-indigo-700 bg-indigo-700 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                  } w-full rounded border px-4 py-2 text-left tracking-wide transition-all`}
                  onClick={() =>
                    router.push(`/?c=${ch.name}`, undefined, {shallow: true})
                  }
                >
                  # {ch.name}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center text-center text-sm font-medium">
          <LightningBoltIcon className="mr-1 h-3 w-3 text-indigo-400" />
          <span className="mr-1 text-gray-400">Powered by </span>
          <a
            className="text-indigo-400 hover:underline"
            href="https://instantdb.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            InstantDB
          </a>
        </div>
      </aside>

      <main className="relative ml-64 flex-1 bg-gray-800">
        <RegisterModal
          isOpen={!currentUser}
          onClose={console.log}
          onSuccess={console.log}
        />

        <div className="absolute top-0 right-0 left-0 bottom-40 w-full overflow-scroll py-8 px-4 text-gray-100">
          {messages
            .sort((a: Message, b: Message) => a.timestamp - b.timestamp)
            .map((message: Message, index: number, list: Array<Message>) => {
              const next = list[index + 1];
              const prev = list[index - 1];
              const isFirstInGroup = !prev || prev.user.id !== message.user.id;
              const isLastInGroup = !next || next.user.id !== message.user.id;
              const isMe = message.user.id === currentUserId;
              const ts = dayjs(message.timestamp).format('MMM D h:mm a');

              return (
                <div
                  key={message.id}
                  className={`${isLastInGroup ? 'mb-4' : 'mb-2'}`}
                >
                  <div>
                    {isFirstInGroup && (
                      <div
                        className={`${
                          isMe ? 'text-right' : 'text-left'
                        } mb-2 text-sm font-medium tracking-wide text-gray-400`}
                      >
                        {message.user.name}
                      </div>
                    )}
                    <div className="group flex items-center justify-between space-x-4">
                      {isMe && (
                        <div className="invisible whitespace-nowrap text-xs tracking-wide text-gray-500 group-hover:visible">
                          {ts}
                        </div>
                      )}
                      <div
                        className={`${
                          isMe ? 'bg-indigo-700' : 'bg-gray-700'
                        } inline-block rounded-lg px-4 py-3`}
                      >
                        {message.body}
                      </div>
                      {!isMe && (
                        <div className="invisible whitespace-nowrap text-xs tracking-wide text-gray-500 group-hover:visible">
                          {ts}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          <div ref={scrollToRef} />
        </div>
        <form
          className="absolute bottom-0 left-0 right-0 border-t border-transparent p-4 text-white"
          onSubmit={handleSendMessage}
        >
          <div className="relative w-full">
            <textarea
              ref={textInputRef}
              className="w-full rounded bg-gray-700 px-4 py-3 outline-none"
              rows={3}
              placeholder="Type a message..."
              value={text}
              autoFocus
              onKeyDown={handleKeyDown}
              onChange={(e) => setMessageText(e.target.value)}
            />

            <button
              type="submit"
              className="absolute bottom-4 right-3 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-gray-100 opacity-60 transition-all hover:text-white hover:opacity-100"
            >
              Press enter to send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

const InstaChatPage: NextPage = () => {
  const data = useQuery({
    users: {},
    messages: {},
    channels: {},
  });

  const seed = () => {
    const channels = [
      {id: id(), name: 'general'},
      {id: id(), name: 'introductions'},
      {id: id(), name: 'random'},
    ];

    transact(
      channels.map((channel) => tx.channels[channel.id].update(channel))
    );
  };

  const reset = () => {
    transact([
      // ...data.channels.map((item: any) => tx.messages[item.id].delete()),
      ...data.users.map((item: any) => tx.messages[item.id].delete()),
      ...data.messages.map((item: any) => tx.messages[item.id].delete()),
    ]);
  };

  // React.useEffect(() => seed(), []);
  // React.useEffect(() => reset(), []);

  return <InstaChat />;
};

export default InstaChatPage;
