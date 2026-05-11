import assert from "node:assert/strict";
import test from "node:test";
import { createSeedDatabase } from "../../server/database.js";
import { buildWorkspaceView, setCandidateStage, toggleTask } from "../../server/workspaceService.js";

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
