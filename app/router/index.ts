import { createWorkspaces, listWorkspaces } from "./workspace";
import { createChannel, listChannels } from "./channel";

export const router = {
  workspace: {
    list: listWorkspaces,
    create: createWorkspaces,
  },
  channel: {
    list: listChannels,
    create: createChannel,
  },
};
