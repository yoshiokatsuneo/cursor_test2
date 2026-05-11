import { activities, candidates as seedCandidates, clients, jobs, pipelineStages, tasks as seedTasks } from "./data.js";
import {
  buildDashboard,
  formatSalary,
  getClientName,
  getRecommendedCandidates,
  getRecommendedJobs,
  groupCandidatesByStage,
  searchRecords
} from "./metrics.js";
import {
  createWorkspaceState,
  hydrateWorkspaceState,
  serializeWorkspaceState,
  toggleTaskStatus,
  updateCandidateStage
} from "./workspaceState.js";

const STORAGE_KEY = "talenthub-hrbc-workspace";

const state = {
  view: "dashboard",
  query: "",
  selectedJobId: jobs.find((job) => job.status === "open")?.id ?? jobs[0]?.id,
  selectedCandidateId: seedCandidates[0]?.id,
  selectedClientId: clients[0]?.id,
  ...loadWorkspaceState()
};

const navigation = [
  { id: "dashboard", label: "ダッシュボード", description: "KPI と次アクション" },
  { id: "candidates", label: "候補者", description: "検索・推薦・進捗" },
  { id: "jobs", label: "求人", description: "案件とマッチ候補" },
  { id: "clients", label: "企業", description: "契約・担当者管理" },
  { id: "pipeline", label: "パイプライン", description: "選考ステージ" }
];

function loadWorkspaceState() {
  const seedState = createWorkspaceState({ candidates: seedCandidates, tasks: seedTasks });
  if (!globalThis.localStorage) {
    return seedState;
  }

  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return hydrateWorkspaceState(seedState, savedState);
  } catch {
    return seedState;
  }
}

function saveWorkspaceState() {
  if (!globalThis.localStorage) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(serializeWorkspaceState({ candidates: state.candidates, tasks: state.tasks }))
  );
}

function resetWorkspaceState() {
  const seedState = createWorkspaceState({ candidates: seedCandidates, tasks: seedTasks });
  state.candidates = seedState.candidates;
  state.tasks = seedState.tasks;
  globalThis.localStorage?.removeItem(STORAGE_KEY);
  render();
}

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return String(value ?? "").replace(/[&<>"']/g, (character) => replacements[character]);
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="product-shell">
      <header class="global-header">
        <div class="global-brand">
          <div class="brand-mark">P</div>
          <div>
            <strong>PORTERS Style</strong>
            <span>HR Business Cloud</span>
          </div>
        </div>
        <div class="global-tabs" aria-label="業務カテゴリ">
          <span class="is-current">人材紹介</span>
          <span>人材派遣</span>
          <span>レポート</span>
          <span>設定</span>
        </div>
        <div class="global-actions">
          <button type="button">一括メール</button>
          <button type="button">CSV 出力</button>
          <button type="button">項目カスタマイズ</button>
        </div>
      </header>

      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <div>
              <p class="eyebrow">Navigation</p>
              <h1>TalentHub HRBC</h1>
            </div>
          </div>
          <nav class="navigation" aria-label="主要メニュー">
            ${navigation
              .map(
                (item) => `
                  <button class="nav-item ${state.view === item.id ? "is-active" : ""}" data-view="${item.id}">
                    <span>${escapeHtml(item.label)}</span>
                    <small>${escapeHtml(item.description)}</small>
                  </button>
                `
              )
              .join("")}
          </nav>
          <div class="sidebar-card">
            <p class="eyebrow">View control</p>
            <strong>Excel ライクな一覧管理</strong>
            <span>列、フェーズ、担当者、次アクションを一覧から確認します。</span>
            <button class="text-action" type="button" data-reset-workspace>デモ状態をリセット</button>
          </div>
        </aside>

        <section class="workspace">
          <header class="topbar">
            <div>
              <p class="eyebrow">PORTERS / HRBC 風プロトタイプ</p>
              <h2>${escapeHtml(navigation.find((item) => item.id === state.view)?.label ?? "Dashboard")}</h2>
            </div>
            <label class="search-box">
              <span>クイック検索</span>
              <input id="global-search" type="search" value="${escapeHtml(state.query)}" placeholder="氏名、求人、企業、スキルで検索" />
            </label>
          </header>
          <main id="main-content" class="content">${renderView()}</main>
        </section>
      </div>
    </div>
  `;

  bindShellEvents();
  bindDynamicEvents();
}

function bindShellEvents() {
  document.querySelectorAll(".navigation [data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  const searchInput = document.querySelector("#global-search");
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    document.querySelector("#main-content").innerHTML = renderView();
    bindDynamicEvents();
  });

  document.querySelector("[data-reset-workspace]").addEventListener("click", resetWorkspaceState);
}

function bindDynamicEvents() {
  document.querySelectorAll("#main-content [data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll("[data-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedJobId = button.dataset.jobId;
      document.querySelector("#main-content").innerHTML = renderView();
      bindDynamicEvents();
    });
  });

  document.querySelectorAll("[data-select-candidate-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCandidateId = button.dataset.selectCandidateId;
      document.querySelector("#main-content").innerHTML = renderView();
      bindDynamicEvents();
    });
  });

  document.querySelectorAll("[data-select-client-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedClientId = button.dataset.selectClientId;
      document.querySelector("#main-content").innerHTML = renderView();
      bindDynamicEvents();
    });
  });

  document.querySelectorAll("[data-stage-select]").forEach((select) => {
    select.addEventListener("change", () => {
      state.candidates = updateCandidateStage(
        state.candidates,
        select.dataset.candidateId,
        select.value,
        pipelineStages,
        new Date().toISOString().slice(0, 10)
      );
      saveWorkspaceState();
      render();
    });
  });

  document.querySelectorAll("[data-task-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tasks = toggleTaskStatus(state.tasks, button.dataset.taskId);
      saveWorkspaceState();
      render();
    });
  });
}

function renderView() {
  switch (state.view) {
    case "candidates":
      return renderCandidates();
    case "jobs":
      return renderJobs();
    case "clients":
      return renderClients();
    case "pipeline":
      return renderPipeline();
    case "dashboard":
    default:
      return renderDashboard();
  }
}

function renderDashboard() {
  const dashboard = buildDashboard({ candidates: state.candidates, jobs, clients, tasks: state.tasks, stages: pipelineStages });
  const activeJobs = jobs.filter((job) => job.status === "open");
  const groups = groupCandidatesByStage(state.candidates, pipelineStages);
  const recentCandidates = [...state.candidates].sort((a, b) => b.lastTouch.localeCompare(a.lastTouch)).slice(0, 6);

  return `
    <section class="porters-board">
      <div class="module-toolbar">
        <div>
          <p class="eyebrow">Home</p>
          <h3>進捗サマリー</h3>
        </div>
        <div class="toolbar-actions">
          <button type="button" data-view="candidates">候補者一覧</button>
          <button type="button" data-view="jobs">求人一覧</button>
          <button type="button" data-view="pipeline">フェーズ確認</button>
        </div>
      </div>

      <section class="metric-strip" aria-label="主要 KPI">
        ${renderMetric("稼働企業", `${dashboard.activeClients} 社`, "Client")}
        ${renderMetric("公開求人", `${dashboard.activeJobs} 件`, `${dashboard.openPositions} ポジション`)}
        ${renderMetric("面接中", `${dashboard.interviewCount} 名`, "Interview")}
        ${renderMetric("決定率", `${dashboard.conversionRate}%`, "Placement")}
        ${renderMetric("未完了タスク", `${dashboard.openTasks} 件`, "Task")}
      </section>

      <div class="dashboard-grid">
        <article class="record-panel">
          <div class="panel-heading">
            <h4>最近接点のあった候補者</h4>
            <span>${recentCandidates.length} records</span>
          </div>
          <div class="table-scroller">
            <table class="record-table">
              <thead>
                <tr>
                  <th>候補者</th>
                  <th>フェーズ</th>
                  <th>担当</th>
                  <th>希望年収</th>
                  <th>最終接点</th>
                  <th>次アクション</th>
                </tr>
              </thead>
              <tbody>${recentCandidates.map(renderCandidateRow).join("")}</tbody>
            </table>
          </div>
        </article>

        <aside class="record-panel">
          <div class="panel-heading">
            <h4>本日の業務キュー</h4>
            <span>activity / task</span>
          </div>
          ${activities.slice(0, 3).map(renderActivity).join("")}
          <div class="task-list">${state.tasks.map(renderTaskItem).join("")}</div>
        </aside>
      </div>

      <div class="dashboard-grid">
        <article class="record-panel">
          <div class="panel-heading">
            <h4>フェーズ別滞留</h4>
            <span>phase summary</span>
          </div>
          <div class="stage-summary">
            ${pipelineStages
              .map(
                (stage) => `
                  <div class="stage-row">
                    <span>${escapeHtml(stage.label)}</span>
                    <strong>${groups[stage.id].length}</strong>
                    <div class="bar"><span style="width: ${Math.max(groups[stage.id].length * 18, 8)}%"></span></div>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="record-panel">
          <div class="panel-heading">
            <h4>優先求人</h4>
            <span>${activeJobs.length} open</span>
          </div>
          <div class="table-scroller">
            <table class="record-table compact">
              <thead>
                <tr>
                  <th>求人</th>
                  <th>企業</th>
                  <th>優先度</th>
                  <th>年収</th>
                </tr>
              </thead>
              <tbody>
                ${activeJobs
                  .slice(0, 4)
                  .map((job) => renderJobRow({ ...job, clientName: getClientName(job.clientId, clients) }))
                  .join("")}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderCandidates() {
  const filteredCandidates = searchRecords(
    state.candidates,
    ["name", "title", "status", "owner", "source", "location", "skills", "summary"],
    state.query
  );
  const selectedCandidate =
    filteredCandidates.find((candidate) => candidate.id === state.selectedCandidateId) ?? filteredCandidates[0];

  return `
    <section class="record-workbench">
      <article class="record-panel">
        ${renderModuleToolbar("Candidate", `候補者 ${filteredCandidates.length} 件`, ["新規候補者", "推薦メール", "重複チェック", "CSV"])}
        <div class="column-filter-row">
          <span>表示項目: 氏名 / フェーズ / 担当 / スキル / 希望年収 / 最終接点</span>
          <span>検索条件を保存</span>
        </div>
        <div class="table-scroller">
          <table class="record-table">
            <thead>
              <tr>
                <th>候補者</th>
                <th>フェーズ</th>
                <th>担当</th>
                <th>スキル</th>
                <th>希望年収</th>
                <th>最終接点</th>
                <th>次アクション</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCandidates.map((candidate) => renderCandidateRow(candidate, selectedCandidate?.id)).join("") || renderEmptyRow("該当する候補者が見つかりません", 7)}
            </tbody>
          </table>
        </div>
      </article>

      <aside class="record-detail-panel">
        ${selectedCandidate ? renderCandidateDetail(selectedCandidate) : renderEmpty("候補者を選択してください")}
      </aside>
    </section>
  `;
}

function renderJobs() {
  const searchableJobs = jobs.map((job) => ({
    ...job,
    clientName: getClientName(job.clientId, clients)
  }));
  const filteredJobs = searchRecords(searchableJobs, ["title", "clientName", "status", "priority", "location", "owner", "requiredSkills", "description"], state.query);
  const selectedJob = filteredJobs.find((job) => job.id === state.selectedJobId) ?? filteredJobs[0] ?? searchableJobs[0];
  const matches = selectedJob ? getRecommendedCandidates(selectedJob, state.candidates, 4) : [];

  return `
    <section class="record-workbench">
      <article class="record-panel">
        ${renderModuleToolbar("Job", `求人 ${filteredJobs.length} 件`, ["求人作成", "候補者検索", "求人票 PDF", "CSV"])}
        <div class="column-filter-row">
          <span>表示項目: 求人 / 企業 / 優先度 / ステータス / 年収 / 必須スキル</span>
          <span>OPEN の求人を優先表示</span>
        </div>
        <div class="table-scroller">
          <table class="record-table">
            <thead>
              <tr>
                <th>求人</th>
                <th>企業</th>
                <th>優先度</th>
                <th>ステータス</th>
                <th>年収</th>
                <th>必須スキル</th>
              </tr>
            </thead>
            <tbody>
              ${filteredJobs.map((job) => renderJobRow(job, selectedJob?.id)).join("") || renderEmptyRow("該当する求人が見つかりません", 6)}
            </tbody>
          </table>
        </div>
      </article>

      <aside class="record-detail-panel">
        ${selectedJob ? renderJobDetail(selectedJob, matches) : renderEmpty("求人を選択してください")}
      </aside>
    </section>
  `;
}

function renderClients() {
  const searchableClients = clients.map((client) => ({
    ...client,
    contactNames: client.contacts.map((contact) => contact.name).join(" ")
  }));
  const filteredClients = searchRecords(searchableClients, ["name", "industry", "owner", "location", "contract", "contactNames", "memo"], state.query);
  const selectedClient = filteredClients.find((client) => client.id === state.selectedClientId) ?? filteredClients[0];

  return `
    <section class="record-workbench">
      <article class="record-panel">
        ${renderModuleToolbar("Client", `取引企業 ${filteredClients.length} 社`, ["企業追加", "担当者追加", "契約更新", "CSV"])}
        <div class="column-filter-row">
          <span>表示項目: 企業 / 業界 / 担当 / 地域 / 契約 / 求人数</span>
          <span>契約ステータス順</span>
        </div>
        <div class="table-scroller">
          <table class="record-table">
            <thead>
              <tr>
                <th>企業</th>
                <th>業界</th>
                <th>担当</th>
                <th>地域</th>
                <th>契約</th>
                <th>求人</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClients.map((client) => renderClientRow(client, selectedClient?.id)).join("") || renderEmptyRow("該当する企業が見つかりません", 6)}
            </tbody>
          </table>
        </div>
      </article>

      <aside class="record-detail-panel">
        ${selectedClient ? renderClientCard(selectedClient) : renderEmpty("企業を選択してください")}
      </aside>
    </section>
  `;
}

function renderPipeline() {
  const groups = groupCandidatesByStage(state.candidates, pipelineStages);

  return `
    <section class="section-heading">
      <div>
        <p class="eyebrow">Selection Pipeline</p>
        <h3>選考パイプライン</h3>
      </div>
      <span class="hint">ステージごとの滞留・次アクションを一覧化します。</span>
    </section>
    <section class="pipeline-board">
      ${pipelineStages
        .map(
          (stage) => `
            <article class="pipeline-column ${escapeHtml(stage.tone)}">
              <header>
                <span>${escapeHtml(stage.label)}</span>
                <strong>${groups[stage.id].length}</strong>
              </header>
              <div class="pipeline-cards">
                ${groups[stage.id].map(renderPipelineCard).join("") || '<p class="empty-mini">候補者なし</p>'}
              </div>
            </article>
          `
        )
        .join("")}
    </section>
  `;
}

function renderMetric(label, value, description) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(description)}</p>
    </article>
  `;
}

function renderModuleToolbar(moduleName, recordCount, actions) {
  return `
    <div class="module-toolbar">
      <div>
        <p class="eyebrow">${escapeHtml(moduleName)} search result</p>
        <h3>${escapeHtml(recordCount)}</h3>
      </div>
      <div class="toolbar-actions">
        ${actions.map((action) => `<button type="button">${escapeHtml(action)}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderEmptyRow(message, colspan) {
  return `
    <tr>
      <td colspan="${colspan}">
        <div class="empty-state compact-empty">${escapeHtml(message)}</div>
      </td>
    </tr>
  `;
}

function getStageLabel(stageId) {
  return pipelineStages.find((stage) => stage.id === stageId)?.label ?? "未設定";
}

function renderCandidateRow(candidate, selectedCandidateId = "") {
  const isSelected = candidate.id === selectedCandidateId;

  return `
    <tr class="${isSelected ? "is-selected" : ""}">
      <td>
        <button class="record-link" type="button" data-select-candidate-id="${escapeHtml(candidate.id)}">
          ${escapeHtml(candidate.name)}
        </button>
        <small>${escapeHtml(candidate.title)} / ${escapeHtml(candidate.source)}</small>
      </td>
      <td><span class="phase-badge">${escapeHtml(getStageLabel(candidate.stage))}</span></td>
      <td>${escapeHtml(candidate.owner)}</td>
      <td>${candidate.skills.slice(0, 3).map((skill) => `<span class="mini-tag">${escapeHtml(skill)}</span>`).join("")}</td>
      <td>${candidate.desiredSalary.toLocaleString("ja-JP")}万円</td>
      <td>${escapeHtml(candidate.lastTouch)}</td>
      <td>${escapeHtml(candidate.nextAction)}</td>
    </tr>
  `;
}

function renderJobRow(job, selectedJobId = "") {
  const isSelected = job.id === selectedJobId;

  return `
    <tr class="${isSelected ? "is-selected" : ""}">
      <td>
        <button class="record-link" type="button" data-job-id="${escapeHtml(job.id)}">
          ${escapeHtml(job.title)}
        </button>
        <small>${escapeHtml(job.location)} / ${job.positions} 名</small>
      </td>
      <td>${escapeHtml(job.clientName ?? getClientName(job.clientId, clients))}</td>
      <td><span class="priority priority-${escapeHtml(job.priority.toLowerCase())}">優先度 ${escapeHtml(job.priority)}</span></td>
      <td><span class="status-pill">${escapeHtml(job.status)}</span></td>
      <td>${formatSalary(job.salaryMin, job.salaryMax)}</td>
      <td>${job.requiredSkills.slice(0, 3).map((skill) => `<span class="mini-tag">${escapeHtml(skill)}</span>`).join("")}</td>
    </tr>
  `;
}

function renderClientRow(client, selectedClientId = "") {
  const isSelected = client.id === selectedClientId;

  return `
    <tr class="${isSelected ? "is-selected" : ""}">
      <td>
        <button class="record-link" type="button" data-select-client-id="${escapeHtml(client.id)}">
          ${escapeHtml(client.name)}
        </button>
        <small>${escapeHtml(client.contacts[0]?.name ?? "担当者未設定")}</small>
      </td>
      <td>${escapeHtml(client.industry)}</td>
      <td>${escapeHtml(client.owner)}</td>
      <td>${escapeHtml(client.location)}</td>
      <td>${escapeHtml(client.contract)}</td>
      <td>${client.openJobs} 件</td>
    </tr>
  `;
}

function renderActivity(activity) {
  return `
    <div class="activity-item">
      <span class="activity-type">${escapeHtml(activity.type)}</span>
      <div>
        <strong>${escapeHtml(activity.title)}</strong>
        <p>${escapeHtml(activity.due)} / ${escapeHtml(activity.owner)}</p>
      </div>
    </div>
  `;
}

function renderTaskItem(task) {
  const isDone = task.status === "done";

  return `
    <div class="task-item ${isDone ? "is-done" : ""}">
      <button type="button" data-task-toggle data-task-id="${escapeHtml(task.id)}" aria-pressed="${isDone}">
        ${isDone ? "完了" : "未完了"}
      </button>
      <div>
        <strong>${escapeHtml(task.title)}</strong>
        <p>${escapeHtml(task.due)} / ${escapeHtml(task.owner)}</p>
      </div>
    </div>
  `;
}

function renderStageOptions(selectedStageId) {
  return pipelineStages
    .map(
      (stage) => `
        <option value="${escapeHtml(stage.id)}" ${stage.id === selectedStageId ? "selected" : ""}>${escapeHtml(stage.label)}</option>
      `
    )
    .join("");
}

function renderCandidateDetail(candidate) {
  const recommendedJobs = getRecommendedJobs(candidate, jobs, 3);

  return `
    <div class="detail-header">
      <div>
        <p class="eyebrow">Candidate detail</p>
        <h3>${escapeHtml(candidate.name)}</h3>
        <span>${escapeHtml(candidate.title)} / ${escapeHtml(candidate.location)}</span>
      </div>
      <span class="status-pill">${escapeHtml(candidate.status)}</span>
    </div>
    <label class="stage-control">
      <span>選考フェーズ</span>
      <select data-stage-select data-candidate-id="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(candidate.name)} の選考ステージ">
        ${renderStageOptions(candidate.stage)}
      </select>
      <small>${escapeHtml(getStageLabel(candidate.stage))}</small>
    </label>
    <div class="detail-fieldset">
      <h4>基本情報</h4>
      <dl class="detail-list vertical">
        <div><dt>担当</dt><dd>${escapeHtml(candidate.owner)}</dd></div>
        <div><dt>流入経路</dt><dd>${escapeHtml(candidate.source)}</dd></div>
        <div><dt>希望年収</dt><dd>${candidate.desiredSalary.toLocaleString("ja-JP")}万円</dd></div>
        <div><dt>入社可能</dt><dd>${escapeHtml(candidate.availability)}</dd></div>
      </dl>
    </div>
    <div class="detail-fieldset">
      <h4>職務要約</h4>
      <p class="detail-copy">${escapeHtml(candidate.summary)}</p>
      <div class="tag-list">${candidate.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
    </div>
    <div class="detail-fieldset">
      <h4>推薦候補求人</h4>
      <div class="recommendation">
        ${recommendedJobs
          .map(
            (job) => `
              <div class="match-row">
                <span>${escapeHtml(job.title)} <small>${escapeHtml(getClientName(job.clientId, clients))}</small></span>
                <b>${job.matchScore}%</b>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
    <div class="next-action">${escapeHtml(candidate.nextAction)}</div>
  `;
}

function renderCandidateCard(candidate) {
  const recommendedJobs = getRecommendedJobs(candidate, jobs, 2);
  const stage = pipelineStages.find((item) => item.id === candidate.stage);

  return `
    <article class="candidate-card">
      <div class="card-heading">
        <div>
          <p class="eyebrow">${escapeHtml(candidate.source)} / ${escapeHtml(candidate.owner)}</p>
          <h4>${escapeHtml(candidate.name)}</h4>
          <span>${escapeHtml(candidate.title)} ・ ${escapeHtml(candidate.location)}</span>
        </div>
        <span class="status-pill">${escapeHtml(candidate.status)}</span>
      </div>
      <label class="stage-control">
        <span>選考ステージ</span>
        <select data-stage-select data-candidate-id="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(candidate.name)} の選考ステージ">
          ${renderStageOptions(candidate.stage)}
        </select>
        <small>${escapeHtml(stage?.label ?? "未設定")}として保存中</small>
      </label>
      <p>${escapeHtml(candidate.summary)}</p>
      <div class="tag-list">${candidate.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
      <dl class="detail-list">
        <div><dt>希望年収</dt><dd>${candidate.desiredSalary.toLocaleString("ja-JP")}万円</dd></div>
        <div><dt>入社可能</dt><dd>${escapeHtml(candidate.availability)}</dd></div>
        <div><dt>最終接点</dt><dd>${escapeHtml(candidate.lastTouch)}</dd></div>
      </dl>
      <div class="recommendation">
        <strong>推薦候補</strong>
        ${recommendedJobs
          .map(
            (job) => `
              <div class="match-row">
                <span>${escapeHtml(job.title)}</span>
                <b>${job.matchScore}%</b>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="next-action">${escapeHtml(candidate.nextAction)}</div>
    </article>
  `;
}

function renderJobSummary(job, clientName) {
  return `
    <div class="job-summary">
      <div>
        <span class="priority priority-${escapeHtml(job.priority.toLowerCase())}">優先度 ${escapeHtml(job.priority)}</span>
        <h4>${escapeHtml(job.title)}</h4>
        <p>${escapeHtml(clientName)} ・ ${escapeHtml(job.location)}</p>
      </div>
      <div class="job-meta">
        <strong>${formatSalary(job.salaryMin, job.salaryMax)}</strong>
        <span>${job.positions} 名 / ${escapeHtml(job.status)}</span>
      </div>
    </div>
  `;
}

function renderJobDetail(job, matches) {
  return `
    <div class="section-heading compact-heading">
      <div>
        <p class="eyebrow">${escapeHtml(getClientName(job.clientId, clients))}</p>
        <h3>${escapeHtml(job.title)}</h3>
      </div>
      <span class="status-pill">${escapeHtml(job.status)}</span>
    </div>
    <p class="detail-copy">${escapeHtml(job.description)}</p>
    <dl class="detail-list vertical">
      <div><dt>年収</dt><dd>${formatSalary(job.salaryMin, job.salaryMax)}</dd></div>
      <div><dt>担当</dt><dd>${escapeHtml(job.owner)}</dd></div>
      <div><dt>今週の目標</dt><dd>${escapeHtml(job.stageGoal)}</dd></div>
    </dl>
    <div class="tag-list">${job.requiredSkills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
    <div class="recommendation large">
      <strong>マッチ候補</strong>
      ${
        matches
          .map(
            (candidate) => `
              <div class="match-row">
                <span>${escapeHtml(candidate.name)} <small>${escapeHtml(candidate.title)}</small></span>
                <b>${candidate.matchScore}%</b>
              </div>
            `
          )
          .join("") || renderEmpty("推薦できる候補者がまだいません")
      }
    </div>
  `;
}

function renderClientCard(client) {
  const clientJobs = jobs.filter((job) => job.clientId === client.id);

  return `
    <article class="client-card">
      <div class="card-heading">
        <div>
          <p class="eyebrow">${escapeHtml(client.industry)} / ${escapeHtml(client.owner)}</p>
          <h4>${escapeHtml(client.name)}</h4>
          <span>${escapeHtml(client.location)} ・ ${escapeHtml(client.contract)}</span>
        </div>
        <span class="health ${escapeHtml(client.health)}">${client.health === "high" ? "良好" : "要確認"}</span>
      </div>
      <p>${escapeHtml(client.memo)}</p>
      <div class="contact-list">
        ${client.contacts
          .map(
            (contact) => `
              <div>
                <strong>${escapeHtml(contact.name)}</strong>
                <span>${escapeHtml(contact.role)} / ${escapeHtml(contact.email)}</span>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="client-jobs">
        <strong>関連求人</strong>
        ${clientJobs.map((job) => `<span>${escapeHtml(job.title)} (${escapeHtml(job.status)})</span>`).join("")}
      </div>
    </article>
  `;
}

function renderPipelineCard(candidate) {
  const matchedJob = jobs.find((job) => candidate.matchedJobIds.includes(job.id));

  return `
    <div class="pipeline-card">
      <strong>${escapeHtml(candidate.name)}</strong>
      <span>${escapeHtml(candidate.title)}</span>
      <p>${escapeHtml(matchedJob?.title ?? "求人未設定")}</p>
      <small>${escapeHtml(candidate.nextAction)}</small>
      <select data-stage-select data-candidate-id="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(candidate.name)} のステージを変更">
        ${renderStageOptions(candidate.stage)}
      </select>
    </div>
  `;
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

render();
