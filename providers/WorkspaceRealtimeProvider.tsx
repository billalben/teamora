"use client";

import { PresenceMessageSchema, RealtimeEvent, RealtimeEventSchema, User } from "@/app/schemas/realtime";
import { env } from "@/lib/env";
import { orpc } from "@/lib/orpc";
import { getWorkspaceDepartureHref } from "@/lib/workspace";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, ReactNode, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

type WorkspaceRealtimeContextValue = {
  onlineUsers: User[];
  sendEvent: (event: RealtimeEvent) => void;
};

const WorkspaceRealtimeContext = createContext<WorkspaceRealtimeContextValue | null>(null);

type WorkspaceRealtimeProviderProps = {
  workspaceId: string;
  children: ReactNode;
};

/**
 * Single websocket connection for the `workspace-${workspaceId}` room. Carries
 * online presence and workspace-scoped membership events (who joined, left or
 * was removed). Membership events invalidate the member lists and, when the
 * affected user is the current one, navigate them out of the workspace.
 */
export function WorkspaceRealtimeProvider({ workspaceId, children }: WorkspaceRealtimeProviderProps) {
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const { data: workspaceData } = useQuery(orpc.workspace.list.queryOptions());

  const currentUser = useMemo<User | null>(() => {
    const user = workspaceData?.user;

    if (!user?.id) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.given_name,
      picture: user.picture,
    };
  }, [workspaceData]);

  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const invalidateMemberQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: orpc.workspace.member.list.queryKey() });
    queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });
    queryClient.invalidateQueries({ queryKey: orpc.workspace.member.activity.queryKey({ input: {} }) });
  }, [queryClient]);

  const invalidateChannelQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });
  }, [queryClient]);

  const redirectAfterDeparture = useCallback(() => {
    const cached = queryClient.getQueryData<{ workspaces: { id: string }[] }>(orpc.workspace.list.queryKey());
    const remainingOrgCodes = cached?.workspaces.map((workspace) => workspace.id) ?? [];

    window.location.assign(getWorkspaceDepartureHref({ leftOrgCode: workspaceId, remainingOrgCodes }));
  }, [queryClient, workspaceId]);

  const socket = usePartySocket({
    host: env.NEXT_PUBLIC_PARTYKIT_HOST,
    room: `workspace-${workspaceId}`,
    party: "chat",

    onOpen() {
      const user = currentUserRef.current;

      if (user) {
        socket.send(JSON.stringify({ type: "add-user", payload: user }));
      }
    },

    onMessage(event) {
      try {
        const parsed = JSON.parse(event.data);

        const presence = PresenceMessageSchema.safeParse(parsed);

        if (presence.success) {
          if (presence.data.type === "presence") {
            setOnlineUsers(presence.data.payload.users);
          }

          return;
        }

        const realtimeEvent = RealtimeEventSchema.safeParse(parsed);

        if (!realtimeEvent.success) {
          return;
        }

        const membership = realtimeEvent.data;

        if (
          membership.type === "member:joined" ||
          membership.type === "member:left" ||
          membership.type === "member:removed"
        ) {
          invalidateMemberQueries();

          if (membership.payload.userId === currentUserRef.current?.id) {
            redirectAfterDeparture();
          }

          return;
        }

        if (
          membership.type === "channel:created" ||
          membership.type === "channel:updated" ||
          membership.type === "channel:deleted"
        ) {
          invalidateChannelQueries();

          return;
        }

        if (membership.type === "channel:access:changed") {
          invalidateChannelQueries();
        }
      } catch (error) {
        console.error("failed to parse workspace realtime message: ", error);
      }
    },

    onError(error) {
      console.error("workspace websocket error: ", error);
    },
  });

  // The socket can open before the current user is loaded, so announce presence
  // again once we know who the user is.
  useEffect(() => {
    if (!currentUser || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ type: "add-user", payload: currentUser }));
  }, [currentUser, socket]);

  const value = useMemo<WorkspaceRealtimeContextValue>(() => {
    return {
      onlineUsers,
      sendEvent: (event) => {
        socket.send(JSON.stringify(event));
      },
    };
  }, [onlineUsers, socket]);

  return <WorkspaceRealtimeContext.Provider value={value}>{children}</WorkspaceRealtimeContext.Provider>;
}

export function useWorkspaceRealtime(): WorkspaceRealtimeContextValue {
  const context = useContext(WorkspaceRealtimeContext);

  if (!context) {
    throw new Error("useWorkspaceRealtime must be used within a WorkspaceRealtimeProvider");
  }

  return context;
}
