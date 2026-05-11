import {
  buildDashboard,
  getRecommendedCandidates,
  getRecommendedJobs,
  groupCandidatesByStage,
  searchRecords
} from "../src/metrics.js";
import { toggleTaskStatus, updateCandidateStage } from "../src/workspaceState.js";

const candidateSearchFields = ["name", "title", "status", "owner", "source", "location", "skills", "summary"];
const jobSearchFields = [
  "title",
  "clientName",
  "status",
  "priority",
  "location",
  "owner",
  "requiredSkills",
  "description"
];
const clientSearchFields = ["name", "industry", "owner", "location", "contract", "contactNames", "memo"];

const editableCandidateFields = new Set([
  "name",
  "title",
  "owner",
  "source",
  "location",
  "desiredSalary",
  "availability",
  "skills",
  "summary",
  "nextAction"
]);
const editableJobFields = new Set([
  "title",
  "status",
  "priority",
  "location",
  "salaryMin",
  "salaryMax",
  "positions",
  "owner",
  "clientId",
  "requiredSkills",
  "stageGoal",
  "description"
]);
const editableClientFields = new Set(["name", "industry", "owner", "location", "contract", "health", "memo"]);

function enrichJobs(jobs, clients) {
  const clientsById = new Map(clients.map((client) => [client.id, client]));

  return jobs.map((job) => ({
    ...job,
    clientName: clientsById.get(job.clientId)?.name ?? "未設定"
  }));
}

function enrichClients(clients, jobs) {
  return clients.map((client) => ({
    ...client,
    contactNames: client.contacts.map((contact) => contact.name).join(" "),
    relatedJobs: jobs.filter((job) => job.clientId === client.id)
  }));
}

function buildRecommendations(candidates, jobs, clients) {
  const enrichedJobs = enrichJobs(jobs, clients);

  return {
    byCandidate: Object.fromEntries(
      candidates.map((candidate) => [
        candidate.id,
        getRecommendedJobs(candidate, jobs, 3).map((job) => ({
          ...job,
          clientName: enrichedJobs.find((enrichedJob) => enrichedJob.id === job.id)?.clientName ?? "未設定"
        }))
      ])
    ),
    byJob: Object.fromEntries(
      jobs.map((job) => [job.id, getRecommendedCandidates(job, candidates, 4)])
    )
  };
}

export function buildWorkspaceView(databaseState, query = "") {
  const enrichedJobs = enrichJobs(databaseState.jobs, databaseState.clients);
  const enrichedClients = enrichClients(databaseState.clients, databaseState.jobs);
  const filteredCandidates = searchRecords(databaseState.candidates, candidateSearchFields, query);
  const filteredJobs = searchRecords(enrichedJobs, jobSearchFields, query);
  const filteredClients = searchRecords(enrichedClients, clientSearchFields, query);
  const stageGroups = groupCandidatesByStage(databaseState.candidates, databaseState.stages);
  const recentCandidates = [...databaseState.candidates]
    .sort((a, b) => b.lastTouch.localeCompare(a.lastTouch))
    .slice(0, 6);
  const recommendations = buildRecommendations(databaseState.candidates, databaseState.jobs, databaseState.clients);

  return {
    stages: databaseState.stages,
    allClients: enrichedClients,
    activities: databaseState.activities,
    tasks: databaseState.tasks,
    candidates: filteredCandidates,
    jobs: filteredJobs,
    clients: filteredClients,
    priorityJobs: enrichedJobs.filter((job) => job.status === "open").slice(0, 4),
    recentCandidates,
    stageGroups,
    dashboard: buildDashboard({
      candidates: databaseState.candidates,
      jobs: databaseState.jobs,
      clients: databaseState.clients,
      tasks: databaseState.tasks,
      stages: databaseState.stages
    }),
    recommendations
  };
}

export async function getWorkspace(database, query = "") {
  return buildWorkspaceView(await database.read(), query);
}

export async function setCandidateStage(database, candidateId, stageId, touchedAt) {
  return database.update((current) => {
    const candidateExists = current.candidates.some((candidate) => candidate.id === candidateId);
    if (!candidateExists) {
      throw Object.assign(new Error("Candidate not found"), { statusCode: 404 });
    }

    const stageExists = current.stages.some((stage) => stage.id === stageId);
    if (!stageExists) {
      throw Object.assign(new Error("Stage not found"), { statusCode: 400 });
    }

    return {
      ...current,
      candidates: updateCandidateStage(current.candidates, candidateId, stageId, current.stages, touchedAt)
    };
  });
}

export async function toggleTask(database, taskId) {
  return database.update((current) => {
    const taskExists = current.tasks.some((task) => task.id === taskId);
    if (!taskExists) {
      throw Object.assign(new Error("Task not found"), { statusCode: 404 });
    }

    return {
      ...current,
      tasks: toggleTaskStatus(current.tasks, taskId)
    };
  });
}

function pickEditableFields(payload, editableFields) {
  return Object.fromEntries(
    Object.entries(payload ?? {}).filter(([fieldName, value]) => editableFields.has(fieldName) && value !== undefined)
  );
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeNumber(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw Object.assign(new Error(`${fieldName} must be a non-negative number`), { statusCode: 400 });
  }

  return numberValue;
}

function normalizeCandidatePatch(payload) {
  const patch = pickEditableFields(payload, editableCandidateFields);
  if ("desiredSalary" in patch) {
    patch.desiredSalary = normalizeNumber(patch.desiredSalary, "desiredSalary");
  }
  if ("skills" in patch) {
    patch.skills = normalizeStringList(patch.skills);
  }
  return patch;
}

function normalizeJobPatch(payload) {
  const patch = pickEditableFields(payload, editableJobFields);
  for (const fieldName of ["salaryMin", "salaryMax", "positions"]) {
    if (fieldName in patch) {
      patch[fieldName] = normalizeNumber(patch[fieldName], fieldName);
    }
  }
  if ("requiredSkills" in patch) {
    patch.requiredSkills = normalizeStringList(patch.requiredSkills);
  }
  return patch;
}

function normalizeClientPatch(payload) {
  return pickEditableFields(payload, editableClientFields);
}

function updateRecord(records, recordId, patch, recordName) {
  let found = false;
  const updatedRecords = records.map((record) => {
    if (record.id !== recordId) {
      return record;
    }

    found = true;
    return {
      ...record,
      ...patch
    };
  });

  if (!found) {
    throw Object.assign(new Error(`${recordName} not found`), { statusCode: 404 });
  }

  return updatedRecords;
}

function nextId(records, prefix) {
  const nextNumber =
    records
      .map((record) => Number(String(record.id).replace(`${prefix}-`, "")))
      .filter(Number.isFinite)
      .reduce((max, current) => Math.max(max, current), 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

export async function updateCandidate(database, candidateId, payload) {
  return database.update((current) => ({
    ...current,
    candidates: updateRecord(current.candidates, candidateId, normalizeCandidatePatch(payload), "Candidate")
  }));
}

export async function updateJob(database, jobId, payload) {
  return database.update((current) => ({
    ...current,
    jobs: updateRecord(current.jobs, jobId, normalizeJobPatch(payload), "Job")
  }));
}

export async function updateClient(database, clientId, payload) {
  return database.update((current) => ({
    ...current,
    clients: updateRecord(current.clients, clientId, normalizeClientPatch(payload), "Client")
  }));
}

export async function createCandidate(database, payload) {
  let createdId = "";

  await database.update((current) => {
    createdId = nextId(current.candidates, "ca");
    const patch = normalizeCandidatePatch(payload);
    const candidate = {
      id: createdId,
      name: patch.name || "新規候補者",
      title: patch.title || "未設定",
      stage: "sourcing",
      status: "接点化",
      owner: patch.owner || "未設定",
      source: patch.source || "手入力",
      location: patch.location || "未設定",
      desiredSalary: patch.desiredSalary ?? 0,
      availability: patch.availability || "未設定",
      lastTouch: new Date().toISOString().slice(0, 10),
      skills: patch.skills ?? [],
      desiredRoles: [],
      matchedJobIds: [],
      summary: patch.summary || "",
      nextAction: patch.nextAction || "次アクションを設定"
    };

    return {
      ...current,
      candidates: [...current.candidates, candidate]
    };
  });

  return createdId;
}

export async function createJob(database, payload) {
  let createdId = "";

  await database.update((current) => {
    createdId = nextId(current.jobs, "job");
    const patch = normalizeJobPatch(payload);
    const job = {
      id: createdId,
      title: patch.title || "新規求人",
      clientId: patch.clientId || current.clients[0]?.id || "",
      status: patch.status || "open",
      priority: patch.priority || "B",
      location: patch.location || "未設定",
      salaryMin: patch.salaryMin ?? 0,
      salaryMax: patch.salaryMax ?? 0,
      positions: patch.positions ?? 1,
      owner: patch.owner || "未設定",
      requiredSkills: patch.requiredSkills ?? [],
      niceToHave: [],
      stageGoal: patch.stageGoal || "推薦候補を確認",
      description: patch.description || ""
    };

    return {
      ...current,
      jobs: [...current.jobs, job]
    };
  });

  return createdId;
}

export async function createClient(database, payload) {
  let createdId = "";

  await database.update((current) => {
    createdId = nextId(current.clients, "cl");
    const patch = normalizeClientPatch(payload);
    const client = {
      id: createdId,
      name: patch.name || "新規企業",
      industry: patch.industry || "未設定",
      owner: patch.owner || "未設定",
      location: patch.location || "未設定",
      contract: patch.contract || "未設定",
      openJobs: 0,
      health: patch.health || "medium",
      contacts: [],
      memo: patch.memo || ""
    };

    return {
      ...current,
      clients: [...current.clients, client]
    };
  });

  return createdId;
}
