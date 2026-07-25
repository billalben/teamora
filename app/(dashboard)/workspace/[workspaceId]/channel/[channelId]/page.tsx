"use client";

import { useParams } from "next/navigation";
import { ChannelHeader } from "./_components/ChannelHeader";
import { MessageInputForm } from "./_components/message/MessageInputForm";
import { MessagesList } from "./_components/MessagesList";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import ThreadSidebar from "./_components/thread/ThreadSidebar";
import { ThreadProvider, useThread } from "@/providers/ThreadProvider";

const ChannelPageMain = () => {
  const { isThreadOpen } = useThread();

  const { channelId } = useParams<{ channelId: string }>();
  const { data, isError } = useQuery(
    orpc.channel.get.queryOptions({
      input: { channelId },
    })
  );

  if (isError) {
    return <p>error</p>;
  }

  return (
    <div className="flex h-screen w-full">
      <div className="flex flex-col flex-1 min-w-0">
        <ChannelHeader channelName={data?.channelName} />

        <div className="flex-1 overflow-hidden my-2 mb-4">
          <MessagesList />
        </div>

        <div className="border-t bg-background p-4">
          <MessageInputForm channelId={channelId} user={data?.currentUser} />
        </div>
      </div>

      {isThreadOpen && <ThreadSidebar />}
    </div>
  );
};

const ChannelPage = () => {
  return (
    <ThreadProvider>
      <ChannelPageMain />
    </ThreadProvider>
  );
};

export default ChannelPage;
