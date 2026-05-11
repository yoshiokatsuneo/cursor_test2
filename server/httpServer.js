import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCandidate,
  createClient,
  createJob,
  getWorkspace,
  setCandidateStage,
  toggleTask,
  updateCandidate,
  updateClient,
  updateJob
} from "./workspaceService.js";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, error) {
  const statusCode = error.statusCode ?? 500;
  sendJson(response, statusCode, {
    error: error.message || "Internal Server Error"
  });
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function safeStaticPath(publicDir, pathname) {
  const decodedPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(publicDir, normalizedPath));
  const root = resolve(publicDir);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  return filePath;
}

async function serveStatic(publicDir, request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405);
    response.end("Method Not Allowed");
    return;
  }

  const filePath = safeStaticPath(publicDir, pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    await readFile(filePath);
  } catch {
    response.writeHead(404);
    response.end("Not Found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes.get(extname(filePath)) ?? "application/octet-stream"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

export function createApp({ database, publicDir = fileURLToPath(new URL("..", import.meta.url)) }) {
  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === "/api/workspace" && request.method === "GET") {
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      if (url.pathname === "/api/candidates" && request.method === "POST") {
        const createdId = await createCandidate(database, await readJsonBody(request));
        sendJson(response, 201, {
          ...(await getWorkspace(database, url.searchParams.get("query") ?? "")),
          created: { type: "candidate", id: createdId }
        });
        return;
      }

      const candidateMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)$/);
      if (candidateMatch && request.method === "PATCH") {
        await updateCandidate(database, candidateMatch[1], await readJsonBody(request));
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      const candidateStageMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/stage$/);
      if (candidateStageMatch && request.method === "PATCH") {
        const body = await readJsonBody(request);
        await setCandidateStage(
          database,
          candidateStageMatch[1],
          body.stage,
          body.touchedAt ?? new Date().toISOString().slice(0, 10)
        );
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      if (url.pathname === "/api/jobs" && request.method === "POST") {
        const createdId = await createJob(database, await readJsonBody(request));
        sendJson(response, 201, {
          ...(await getWorkspace(database, url.searchParams.get("query") ?? "")),
          created: { type: "job", id: createdId }
        });
        return;
      }

      const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
      if (jobMatch && request.method === "PATCH") {
        await updateJob(database, jobMatch[1], await readJsonBody(request));
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      if (url.pathname === "/api/clients" && request.method === "POST") {
        const createdId = await createClient(database, await readJsonBody(request));
        sendJson(response, 201, {
          ...(await getWorkspace(database, url.searchParams.get("query") ?? "")),
          created: { type: "client", id: createdId }
        });
        return;
      }

      const clientMatch = url.pathname.match(/^\/api\/clients\/([^/]+)$/);
      if (clientMatch && request.method === "PATCH") {
        await updateClient(database, clientMatch[1], await readJsonBody(request));
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      const taskToggleMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/toggle$/);
      if (taskToggleMatch && request.method === "PATCH") {
        await toggleTask(database, taskToggleMatch[1]);
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      if (url.pathname === "/api/reset" && request.method === "POST") {
        await database.reset();
        sendJson(response, 200, await getWorkspace(database, url.searchParams.get("query") ?? ""));
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        sendJson(response, 404, { error: "API route not found" });
        return;
      }

      await serveStatic(publicDir, request, response, url.pathname);
    } catch (error) {
      sendError(response, error);
    }
  });
}
