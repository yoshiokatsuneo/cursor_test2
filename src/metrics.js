export function normalize(value) {
  return String(value ?? "").toLocaleLowerCase("ja-JP");
}

export function searchRecords(records, fields, query) {
  const keyword = normalize(query).trim();
  if (!keyword) {
    return records;
  }

  return records.filter((record) =>
    fields.some((field) => {
      const value = record[field];
      if (Array.isArray(value)) {
        return value.some((entry) => normalize(entry).includes(keyword));
      }
      return normalize(value).includes(keyword);
    })
  );
}

export function formatSalary(min, max) {
  if (min && max) {
    return `${min.toLocaleString("ja-JP")}〜${max.toLocaleString("ja-JP")}万円`;
  }
  if (min) {
    return `${min.toLocaleString("ja-JP")}万円〜`;
  }
  if (max) {
    return `〜${max.toLocaleString("ja-JP")}万円`;
  }
  return "応相談";
}

export function getClientName(clientId, clients) {
  return clients.find((client) => client.id === clientId)?.name ?? "未設定";
}

export function groupCandidatesByStage(candidates, stages) {
  return stages.reduce((groups, stage) => {
    groups[stage.id] = candidates.filter((candidate) => candidate.stage === stage.id);
    return groups;
  }, {});
}

export function calculateSkillMatch(candidateSkills, requiredSkills) {
  if (!requiredSkills.length) {
    return 0;
  }

  const candidateSkillSet = new Set(candidateSkills.map(normalize));
  const matchedSkills = requiredSkills.filter((skill) => candidateSkillSet.has(normalize(skill)));

  return Math.round((matchedSkills.length / requiredSkills.length) * 100);
}

export function scoreCandidateForJob(candidate, job) {
  const skillScore = calculateSkillMatch(candidate.skills, job.requiredSkills);
  const salaryFits = candidate.desiredSalary <= job.salaryMax;
  const locationFits =
    normalize(job.location).includes("リモート") ||
    normalize(candidate.location).includes("リモート") ||
    normalize(job.location).includes(normalize(candidate.location));
  const activeStageBonus = candidate.stage === "placed" ? -20 : 10;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(skillScore * 0.72 + (salaryFits ? 12 : 0) + (locationFits ? 6 : 0) + activeStageBonus)
    )
  );
}

export function getRecommendedCandidates(job, candidates, limit = 3) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      matchScore: scoreCandidateForJob(candidate, job)
    }))
    .filter((candidate) => candidate.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name, "ja-JP"))
    .slice(0, limit);
}

export function getRecommendedJobs(candidate, jobs, limit = 3) {
  return jobs
    .filter((job) => job.status === "open")
    .map((job) => ({
      ...job,
      matchScore: scoreCandidateForJob(candidate, job)
    }))
    .filter((job) => job.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title, "ja-JP"))
    .slice(0, limit);
}

export function buildDashboard({ candidates, jobs, clients, tasks, stages }) {
  const activeJobs = jobs.filter((job) => job.status === "open");
  const placedCount = candidates.filter((candidate) => candidate.stage === "placed").length;
  const interviewCount = candidates.filter((candidate) => candidate.stage === "interview").length;
  const openTasks = tasks.filter((task) => task.status === "open").length;
  const stageGroups = groupCandidatesByStage(candidates, stages);
  const conversionRate = candidates.length ? Math.round((placedCount / candidates.length) * 100) : 0;

  return {
    activeClients: clients.length,
    activeJobs: activeJobs.length,
    openPositions: activeJobs.reduce((total, job) => total + job.positions, 0),
    candidates: candidates.length,
    interviewCount,
    placedCount,
    openTasks,
    conversionRate,
    stageCounts: Object.fromEntries(
      Object.entries(stageGroups).map(([stageId, stageCandidates]) => [stageId, stageCandidates.length])
    )
  };
}
