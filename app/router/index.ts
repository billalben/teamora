import { createWorkspaces, listWorkspaces } from "./workspace";
import { createChannel, getChannel, listChannels } from "./channel";
import { createMessage, listMessages, updateMessage, listThreadReplies, toggleMessageReaction } from "./message";
import { deleteUpload } from "./attachment";
import { inviteMember, listMembers } from "./member";

export const router = {
  workspace: {
    list: listWorkspaces,
    create: createWorkspaces,
    member: {
      list: listMembers,
      invite: inviteMember,
    },
  },
  channel: {
    list: listChannels,
    create: createChannel,
    get: getChannel,
  },
  message: {
    create: createMessage,
    list: listMessages,
    update: updateMessage,
    thread: {
      list: listThreadReplies,
    },
    reaction: {
      toggle: toggleMessageReaction,
    },
  },
  attachment: {
    deleteUpload,
  },
};
