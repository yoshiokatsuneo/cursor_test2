import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { JsonDatabase } from "../../server/database.js";
import { createApp } from "../../server/httpServer.js";

async function withServer(testBody) {
  const tempDir = await mkdtemp(join(tmpdir(), "hrbc-api-"));
  const database = new JsonDatabase(join(tempDir, "db.json"));
  await database.init();
  const server = createApp({ database, publicDir: process.cwd() });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    await testBody(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("GET /api/workspace returns the backend view model", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/workspace?query=React`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.candidates[0].name, "山田 海斗");
    assert.equal(payload.dashboard.activeClients, 3);
    assert.equal(payload.recommendations.byJob["job-003"][0].name, "山田 海斗");
  });
});

test("PATCH candidate stage updates the JSON database via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/candidates/ca-004/stage`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stage: "interview", touchedAt: "2026-05-12" })
    });
    const payload = await response.json();
    const candidate = payload.candidates.find((item) => item.id === "ca-004");

    assert.equal(response.status, 200);
    assert.equal(candidate.stage, "interview");
    assert.equal(candidate.status, "選考中");
  });
});

test("PATCH task toggle updates task status via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks/ta-001/toggle`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.tasks.find((task) => task.id === "ta-001").status, "done");
  });
});

test("PATCH candidate updates editable fields via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/candidates/ca-001`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "中村 蓮 API", skills: ["Node.js", "Go"] })
    });
    const payload = await response.json();
    const candidate = payload.candidates.find((item) => item.id === "ca-001");

    assert.equal(response.status, 200);
    assert.equal(candidate.name, "中村 蓮 API");
    assert.deepEqual(candidate.skills, ["Node.js", "Go"]);
  });
});

test("PATCH job updates editable fields via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs/job-001`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "API バックエンドリード", salaryMin: 900 })
    });
    const payload = await response.json();
    const job = payload.jobs.find((item) => item.id === "job-001");

    assert.equal(response.status, 200);
    assert.equal(job.title, "API バックエンドリード");
    assert.equal(job.salaryMin, 900);
  });
});

test("PATCH client updates editable fields via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/clients/cl-001`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contract: "成功報酬 40%", health: "medium" })
    });
    const payload = await response.json();
    const client = payload.clients.find((item) => item.id === "cl-001");

    assert.equal(response.status, 200);
    assert.equal(client.contract, "成功報酬 40%");
    assert.equal(client.health, "medium");
  });
});

test("POST candidate creates a candidate via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/candidates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "API 新規候補者", skills: "Node.js, AWS" })
    });
    const payload = await response.json();
    const candidate = payload.candidates.find((item) => item.id === payload.created.id);

    assert.equal(response.status, 201);
    assert.equal(payload.created.type, "candidate");
    assert.equal(candidate.name, "API 新規候補者");
    assert.deepEqual(candidate.skills, ["Node.js", "AWS"]);
  });
});

test("POST job creates a job via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "API 新規求人", clientId: "cl-001", requiredSkills: ["Go"] })
    });
    const payload = await response.json();
    const job = payload.jobs.find((item) => item.id === payload.created.id);

    assert.equal(response.status, 201);
    assert.equal(payload.created.type, "job");
    assert.equal(job.title, "API 新規求人");
    assert.equal(job.clientId, "cl-001");
  });
});

test("POST client creates a client via API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/clients`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "API 新規企業", industry: "AI" })
    });
    const payload = await response.json();
    const client = payload.clients.find((item) => item.id === payload.created.id);

    assert.equal(response.status, 201);
    assert.equal(payload.created.type, "client");
    assert.equal(client.name, "API 新規企業");
    assert.equal(client.industry, "AI");
  });
});
