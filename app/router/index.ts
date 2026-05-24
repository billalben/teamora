import { createWorkspaces, listWorkspaces } from "./workspace";
import { createChannel, listChannels } from "./channel";
import { createMessage, listMessages } from "./message";
import { deleteUpload } from "./attachment";

export const router = {
  workspace: {
    list: listWorkspaces,
    create: createWorkspaces,
  },
  channel: {
    list: listChannels,
    create: createChannel,
  },
  message: {
    create: createMessage,
    list: listMessages,
  },
  attachment: {
    deleteUpload,
  },
};
