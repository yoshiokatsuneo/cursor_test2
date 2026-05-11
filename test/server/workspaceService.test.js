import assert from "node:assert/strict";
import test from "node:test";
import { createSeedDatabase } from "../../server/database.js";
import {
  buildWorkspaceView,
  setCandidateStage,
  toggleTask,
  updateCandidate,
  updateClient,
  updateJob
} from "../../server/workspaceService.js";

function createMemoryDatabase(seed = createSeedDatabase()) {
  let state = structuredClone(seed);

  return {
    async read() {
      return structuredClone(state);
    },
    async update(mutator) {
      state = await mutator(structuredClone(state));
      return structuredClone(state);
    },
    async reset() {
      state = createSeedDatabase();
      return structuredClone(state);
    }
  };
}

test("buildWorkspaceView returns backend-computed dashboard and recommendations", () => {
  const view = buildWorkspaceView(createSeedDatabase(), "TypeScript");

  assert.equal(view.dashboard.activeJobs, 4);
  assert.deepEqual(
    view.candidates.map((candidate) => candidate.name),
    ["中村 蓮", "山田 海斗"]
  );
  assert.equal(view.jobs.some((job) => job.clientName === "株式会社クラウドリンク"), true);
  assert.equal(view.recommendations.byCandidate["ca-001"][0].title, "シニアバックエンドエンジニア");
  assert.equal(view.stageGroups.interview.length, 1);
});

test("setCandidateStage persists candidate phase changes through the database boundary", async () => {
  const database = createMemoryDatabase();

  await setCandidateStage(database, "ca-004", "interview", "2026-05-12");
  const updated = await database.read();
  const candidate = updated.candidates.find((item) => item.id === "ca-004");

  assert.equal(candidate.stage, "interview");
  assert.equal(candidate.status, "選考中");
  assert.equal(candidate.lastTouch, "2026-05-12");
});

test("toggleTask persists task status changes through the database boundary", async () => {
  const database = createMemoryDatabase();

  await toggleTask(database, "ta-001");
  const updated = await database.read();

  assert.equal(updated.tasks.find((task) => task.id === "ta-001").status, "done");
});

test("updateCandidate persists editable candidate fields", async () => {
  const database = createMemoryDatabase();

  await updateCandidate(database, "ca-001", {
    name: "中村 蓮 Edited",
    desiredSalary: "1110",
    skills: "Node.js, Go, AWS"
  });
  const updated = await database.read();
  const candidate = updated.candidates.find((item) => item.id === "ca-001");

  assert.equal(candidate.name, "中村 蓮 Edited");
  assert.equal(candidate.desiredSalary, 1110);
  assert.deepEqual(candidate.skills, ["Node.js", "Go", "AWS"]);
});

test("updateJob persists editable job fields", async () => {
  const database = createMemoryDatabase();

  await updateJob(database, "job-001", {
    title: "バックエンドリード",
    salaryMax: "1350",
    requiredSkills: ["Node.js", "AWS", "Architecture"]
  });
  const updated = await database.read();
  const job = updated.jobs.find((item) => item.id === "job-001");

  assert.equal(job.title, "バックエンドリード");
  assert.equal(job.salaryMax, 1350);
  assert.deepEqual(job.requiredSkills, ["Node.js", "AWS", "Architecture"]);
});

test("updateClient persists editable client fields", async () => {
  const database = createMemoryDatabase();

  await updateClient(database, "cl-001", {
    name: "株式会社クラウドリンク Edited",
    contract: "成功報酬 40%",
    memo: "更新済み"
  });
  const updated = await database.read();
  const client = updated.clients.find((item) => item.id === "cl-001");

  assert.equal(client.name, "株式会社クラウドリンク Edited");
  assert.equal(client.contract, "成功報酬 40%");
  assert.equal(client.memo, "更新済み");
});
