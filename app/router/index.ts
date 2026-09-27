import { createWorkspaces, listWorkspaces } from "./workspace";
import { createChannel, getChannel, listChannels } from "./channel";
import {
  createMessage,
  deleteMessage,
  restoreMessage,
  listMessages,
  updateMessage,
  listThreadReplies,
  toggleMessageReaction,
} from "./message";
import { deleteUpload } from "./attachment";
import { inviteMember, leaveWorkspace, listActivity, listMembers, removeMember } from "./member";
import { generateCompose, generateThreadSummary } from "./ai";

export const router = {
  workspace: {
    list: listWorkspaces,
    create: createWorkspaces,
    member: {
      list: listMembers,
      invite: inviteMember,
      remove: removeMember,
      leave: leaveWorkspace,
      activity: listActivity,
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
    delete: deleteMessage,
    restore: restoreMessage,
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
  ai: {
    compose: {
      generate: generateCompose,
    },
    thread: {
      summary: {
        generate: generateThreadSummary,
      },
    },
  },
};
