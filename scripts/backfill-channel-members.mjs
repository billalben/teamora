// One-off backfill: when channels became private, grant every existing
// workspace member access to every channel that already existed.
//
// Usage: node scripts/backfill-channel-members.mjs
//
// Kinde organization membership is not stored in Postgres, so this script
// reads the Kinde Management API to discover who belongs to each workspace
// and inserts the missing ChannelMember rows.

import "dotenv/config";
import { Client } from "pg";
import { init, Organizations } from "@kinde/management-api-js";

async function main() {
  if (!process.env.KINDE_CLIENT_ID || !process.env.KINDE_CLIENT_SECRET) {
    console.warn("Kinde credentials are not configured; nothing to backfill.");
    return;
  }

  init();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let inserted = 0;
  let skipped = 0;

  try {
    const { rows: channels } = await client.query('SELECT DISTINCT "workspaceId" FROM "Channel"');

    for (const { workspaceId } of channels) {
      let members = [];

      try {
        const { organization_users } = await Organizations.getOrganizationUsers({
          orgCode: workspaceId,
          sort: "name_asc",
        });

        members = organization_users ?? [];
      } catch (error) {
        console.error(`Failed to load members for workspace ${workspaceId}:`, error);
        continue;
      }

      const { rows: workspaceChannels } = await client.query('SELECT "id" FROM "Channel" WHERE "workspaceId" = $1', [
        workspaceId,
      ]);

      for (const channel of workspaceChannels) {
        for (const member of members) {
          if (!member.id) continue;

          const result = await client.query(
            `INSERT INTO "ChannelMember" ("id", "channelId", "userId")
             VALUES (gen_random_uuid()::text, $1, $2)
             ON CONFLICT ("channelId", "userId") DO NOTHING`,
            [channel.id, member.id]
          );

          if (result.rowCount > 0) {
            inserted += 1;
          } else {
            skipped += 1;
          }
        }
      }
    }
  } finally {
    await client.end();
  }

  console.log(`Backfill complete: ${inserted} inserted, ${skipped} already present.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
