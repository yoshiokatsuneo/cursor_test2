import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonDatabase } from "./database.js";
import { createApp } from "./httpServer.js";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const databasePath = process.env.HRBC_DB_PATH ?? resolve(rootDir, ".data/hrbc-db.json");

const database = new JsonDatabase(databasePath);
await database.init();

const server = createApp({ database, publicDir: rootDir });

server.listen(port, "0.0.0.0", () => {
  console.log(`TalentHub HRBC backend listening on http://0.0.0.0:${port}`);
  console.log(`Using database: ${databasePath}`);
});
