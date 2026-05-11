export const candidateStatusByStage = {
  sourcing: "接点化",
  screening: "推薦準備",
  interview: "選考中",
  offer: "条件調整",
  placed: "決定"
};

export function createWorkspaceState({ candidates, tasks }) {
  return {
    candidates: candidates.map((candidate) => ({ ...candidate })),
    tasks: tasks.map((task) => ({ ...task }))
  };
}

export function hydrateWorkspaceState(seedState, savedState = {}) {
  const savedCandidatesById = new Map((savedState.candidates ?? []).map((candidate) => [candidate.id, candidate]));
  const savedTasksById = new Map((savedState.tasks ?? []).map((task) => [task.id, task]));

  return {
    candidates: seedState.candidates.map((candidate) => {
      const savedCandidate = savedCandidatesById.get(candidate.id);
      if (!savedCandidate) {
        return { ...candidate };
      }

      return {
        ...candidate,
        stage: savedCandidate.stage ?? candidate.stage,
        status: savedCandidate.status ?? candidate.status,
        lastTouch: savedCandidate.lastTouch ?? candidate.lastTouch
      };
    }),
    tasks: seedState.tasks.map((task) => {
      const savedTask = savedTasksById.get(task.id);
      if (!savedTask) {
        return { ...task };
      }

      return {
        ...task,
        status: savedTask.status === "done" ? "done" : "open"
      };
    })
  };
}

export function serializeWorkspaceState({ candidates, tasks }) {
  return {
    candidates: candidates.map(({ id, stage, status, lastTouch }) => ({ id, stage, status, lastTouch })),
    tasks: tasks.map(({ id, status }) => ({ id, status }))
  };
}

export function updateCandidateStage(candidates, candidateId, nextStageId, stages, touchedAt) {
  const stageExists = stages.some((stage) => stage.id === nextStageId);
  if (!stageExists) {
    return candidates;
  }

  return candidates.map((candidate) => {
    if (candidate.id !== candidateId) {
      return candidate;
    }

    return {
      ...candidate,
      stage: nextStageId,
      status: candidateStatusByStage[nextStageId] ?? candidate.status,
      lastTouch: touchedAt ?? candidate.lastTouch
    };
  });
}

export function toggleTaskStatus(tasks, taskId) {
  return tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      status: task.status === "done" ? "open" : "done"
    };
  });
}
