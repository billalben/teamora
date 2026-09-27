import { createWorkspaces, listWorkspaces } from "./workspace";
import {
  addChannelMember,
  createChannel,
  deleteChannel,
  getChannel,
  leaveChannel,
  listChannels,
  listChannelMembers,
  removeChannelMember,
  updateChannel,
  updateChannelMembers,
} from "./channel";
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
    update: updateChannel,
    delete: deleteChannel,
    member: {
      list: listChannelMembers,
      add: addChannelMember,
      remove: removeChannelMember,
      update: updateChannelMembers,
    },
    leave: leaveChannel,
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
