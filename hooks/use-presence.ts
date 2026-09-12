import { useState } from "react";

import usePartySocket from "partysocket/react";
import { PresenceMessage, PresenceMessageSchema, User } from "@/app/schemas/realtime";
import { env } from "@/lib/env";

interface usePresenceProps {
  room: string;
  currentUser: User | null;
}

export function usePresence({ room, currentUser }: usePresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const socket = usePartySocket({
    host: env.NEXT_PUBLIC_PARTYKIT_HOST,
    room: room,
    party: "chat",
    onOpen() {
      console.log("connected to presence room: ", room);

      if (currentUser) {
        const message: PresenceMessage = {
          type: "add-user",
          payload: currentUser,
        };

        socket.send(JSON.stringify(message));
      }
    },
    onMessage(event) {
      try {
        const message = JSON.parse(event.data);

        const result = PresenceMessageSchema.safeParse(message);

        if (result.success && result.data.type === "presence") {
          setOnlineUsers(result.data.payload.users);
        }
      } catch (error) {
        console.error("failed to parse message: ", error);
      }
    },
    onClose() {
      console.log("disconnected from presence room: ", room);
    },
    onError(error) {
      console.error("websocket error: ", error);
    },
  });

  return {
    onlineUsers,
    socket,
  };
}
