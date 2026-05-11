import assert from "node:assert/strict";
import test from "node:test";
import { candidates, pipelineStages, tasks } from "../src/data.js";
import {
  createWorkspaceState,
  hydrateWorkspaceState,
  serializeWorkspaceState,
  toggleTaskStatus,
  updateCandidateStage
} from "../src/workspaceState.js";

test("updateCandidateStage changes stage, status, and last touch date", () => {
  const updatedCandidates = updateCandidateStage(candidates, "ca-004", "interview", pipelineStages, "2026-05-12");
  const updatedCandidate = updatedCandidates.find((candidate) => candidate.id === "ca-004");

  assert.equal(updatedCandidate.stage, "interview");
  assert.equal(updatedCandidate.status, "選考中");
  assert.equal(updatedCandidate.lastTouch, "2026-05-12");
});

test("updateCandidateStage ignores unknown stages", () => {
  const updatedCandidates = updateCandidateStage(candidates, "ca-004", "unknown", pipelineStages);

  assert.equal(updatedCandidates, candidates);
});

test("toggleTaskStatus flips open and done states", () => {
  const doneTasks = toggleTaskStatus(tasks, "ta-001");
  const reopenedTasks = toggleTaskStatus(doneTasks, "ta-001");

  assert.equal(doneTasks.find((task) => task.id === "ta-001").status, "done");
  assert.equal(reopenedTasks.find((task) => task.id === "ta-001").status, "open");
});

test("hydrateWorkspaceState overlays saved interactive fields only", () => {
  const seedState = createWorkspaceState({ candidates, tasks });
  const savedState = {
    candidates: [{ id: "ca-001", stage: "offer", status: "条件調整", lastTouch: "2026-05-12", name: "上書き不可" }],
    tasks: [{ id: "ta-001", status: "done", title: "上書き不可" }]
  };
  const hydrated = hydrateWorkspaceState(seedState, savedState);

  assert.equal(hydrated.candidates.find((candidate) => candidate.id === "ca-001").name, "中村 蓮");
  assert.equal(hydrated.candidates.find((candidate) => candidate.id === "ca-001").stage, "offer");
  assert.equal(hydrated.tasks.find((task) => task.id === "ta-001").title, "候補者 3 名へスカウト再送");
  assert.equal(hydrated.tasks.find((task) => task.id === "ta-001").status, "done");
});

test("serializeWorkspaceState keeps persisted payload small", () => {
  const serialized = serializeWorkspaceState(createWorkspaceState({ candidates, tasks }));

  assert.deepEqual(Object.keys(serialized.candidates[0]).sort(), ["id", "lastTouch", "stage", "status"]);
  assert.deepEqual(Object.keys(serialized.tasks[0]).sort(), ["id", "status"]);
});
