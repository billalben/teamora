import { MessageItem } from "./message/MessageItem";

export function MessagesList() {
  const MESSAGES = [
    {
      id: 1,
      message: "Hello, how are you?",
      date: new Date("2024-06-12T10:00:00"),
      avatar: "https://avatars.githubusercontent.com/u/1?v=4",
      username: "Alice",
    },
    {
      id: 2,
      message: "I'm good, thanks! And you?",
      date: new Date("2024-06-12T10:05:00"),
      avatar: "https://avatars.githubusercontent.com/u/2?v=4",
      username: "Bob",
    },
    {
      id: 3,
      message: "Doing well, just working on a project.",
      date: new Date("2024-06-12T10:10:00"),
      avatar: "https://avatars.githubusercontent.com/u/3?v=4",
      username: "Charlie",
    },
  ];

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4">
        {MESSAGES.map((message) => (
          <MessageItem key={message.id} {...message} />
        ))}
      </div>
    </div>
  );
}
