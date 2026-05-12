import assert from "node:assert/strict";
import test from "node:test";
import { candidates, clients, jobs, pipelineStages, tasks } from "../src/data.js";
import {
  buildDashboard,
  calculateSkillMatch,
  getRecommendedCandidates,
  getRecommendedJobs,
  searchRecords
} from "../src/metrics.js";

test("buildDashboard summarizes recruiting operations", () => {
  const dashboard = buildDashboard({ candidates, jobs, clients, tasks, stages: pipelineStages });

  assert.equal(dashboard.activeClients, 3);
  assert.equal(dashboard.activeJobs, 4);
  assert.equal(dashboard.openPositions, 6);
  assert.equal(dashboard.candidates, 6);
  assert.equal(dashboard.stageCounts.interview, 1);
  assert.equal(dashboard.stageCounts.placed, 1);
  assert.equal(dashboard.openTasks, 3);
});

test("searchRecords searches array fields and Japanese text", () => {
  const skillMatches = searchRecords(candidates, ["name", "skills"], "TypeScript");
  const roleMatches = searchRecords(jobs, ["title", "description"], "医療データ");

  assert.deepEqual(
    skillMatches.map((candidate) => candidate.name),
    ["中村 蓮", "山田 海斗"]
  );
  assert.deepEqual(
    roleMatches.map((job) => job.title),
    ["データサイエンティスト"]
  );
});

test("calculateSkillMatch returns a required-skill percentage", () => {
  assert.equal(calculateSkillMatch(["Node.js", "TypeScript", "AWS"], ["Node.js", "TypeScript", "AWS", "API設計"]), 75);
});

test("getRecommendedCandidates ranks strong matches first", () => {
  const backendJob = jobs.find((job) => job.id === "job-001");
  const recommendations = getRecommendedCandidates(backendJob, candidates, 2);

  assert.equal(recommendations[0].name, "中村 蓮");
  assert.ok(recommendations[0].matchScore > recommendations[1].matchScore);
});

test("getRecommendedJobs ignores paused jobs", () => {
  const customerSuccess = candidates.find((candidate) => candidate.id === "ca-005");
  const recommendations = getRecommendedJobs(customerSuccess, jobs, 5);

  assert.equal(recommendations.some((job) => job.id === "job-005"), false);
});
