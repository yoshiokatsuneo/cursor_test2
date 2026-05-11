import { activities, candidates, clients, jobs, pipelineStages, tasks } from "./data.js";
import {
  buildDashboard,
  formatSalary,
  getClientName,
  getRecommendedCandidates,
  getRecommendedJobs,
  groupCandidatesByStage,
  searchRecords
} from "./metrics.js";

const state = {
  view: "dashboard",
  query: "",
  selectedJobId: jobs.find((job) => job.status === "open")?.id ?? jobs[0]?.id
};

const navigation = [
  { id: "dashboard", label: "ダッシュボード", description: "KPI と次アクション" },
  { id: "candidates", label: "候補者", description: "検索・推薦・進捗" },
  { id: "jobs", label: "求人", description: "案件とマッチ候補" },
  { id: "clients", label: "企業", description: "契約・担当者管理" },
  { id: "pipeline", label: "パイプライン", description: "選考ステージ" }
];

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
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">TH</div>
          <div>
            <p class="eyebrow">Recruiting CRM</p>
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
          <p class="eyebrow">今日の重点</p>
          <strong>推薦スピードを上げる</strong>
          <span>面接調整・条件確認・求人票更新を同じ画面で追跡します。</span>
        </div>
      </aside>

      <section class="workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">PORTERS / HRBC 風プロトタイプ</p>
            <h2>${escapeHtml(navigation.find((item) => item.id === state.view)?.label ?? "Dashboard")}</h2>
          </div>
          <label class="search-box">
            <span>横断検索</span>
            <input id="global-search" type="search" value="${escapeHtml(state.query)}" placeholder="候補者、求人、企業、スキルで検索" />
          </label>
        </header>
        <main id="main-content" class="content">${renderView()}</main>
      </section>
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
  const dashboard = buildDashboard({ candidates, jobs, clients, tasks, stages: pipelineStages });
  const activeJobs = jobs.filter((job) => job.status === "open");
  const groups = groupCandidatesByStage(candidates, pipelineStages);

  return `
    <section class="hero-grid">
      <article class="hero-card">
        <p class="eyebrow">今月の採用進捗</p>
        <h3>${dashboard.placedCount} 名決定 / ${dashboard.candidates} 名管理中</h3>
        <p>候補者、求人、企業、活動履歴をひとつの業務台帳として扱うミニ CRM です。</p>
        <div class="hero-actions">
          <button class="primary-action" data-view="candidates">候補者を確認</button>
          <button class="secondary-action" data-view="pipeline">パイプラインへ</button>
        </div>
      </article>
      <article class="next-card">
        <p class="eyebrow">次のアクション</p>
        ${activities.slice(0, 3).map(renderActivity).join("")}
      </article>
    </section>

    <section class="metric-grid" aria-label="主要 KPI">
      ${renderMetric("稼働企業", `${dashboard.activeClients} 社`, "契約・担当者を管理")}
      ${renderMetric("公開求人", `${dashboard.activeJobs} 件`, `${dashboard.openPositions} ポジション募集中`)}
      ${renderMetric("面接中", `${dashboard.interviewCount} 名`, "日程調整と評価回収")}
      ${renderMetric("決定率", `${dashboard.conversionRate}%`, "候補者全体に対する決定")}
      ${renderMetric("未完了タスク", `${dashboard.openTasks} 件`, "本日の対応漏れを確認")}
    </section>

    <section class="two-column">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Pipeline</p>
            <h3>選考ステージ別の滞留</h3>
          </div>
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

      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Priority Jobs</p>
            <h3>優先案件</h3>
          </div>
        </div>
        <div class="job-list compact">
          ${activeJobs
            .slice(0, 4)
            .map((job) => renderJobSummary(job, getClientName(job.clientId, clients)))
            .join("")}
        </div>
      </article>
    </section>
  `;
}

function renderCandidates() {
  const filteredCandidates = searchRecords(candidates, ["name", "title", "status", "owner", "source", "location", "skills", "summary"], state.query);

  return `
    <section class="section-heading">
      <div>
        <p class="eyebrow">Candidate Database</p>
        <h3>候補者 ${filteredCandidates.length} 名</h3>
      </div>
      <span class="hint">スキル・担当者・進捗で即時検索できます。</span>
    </section>
    <section class="candidate-grid">
      ${filteredCandidates.map(renderCandidateCard).join("") || renderEmpty("該当する候補者が見つかりません")}
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
  const matches = selectedJob ? getRecommendedCandidates(selectedJob, candidates, 4) : [];

  return `
    <section class="jobs-layout">
      <div>
        <div class="section-heading">
          <div>
            <p class="eyebrow">Job Orders</p>
            <h3>求人 ${filteredJobs.length} 件</h3>
          </div>
        </div>
        <div class="job-list">
          ${filteredJobs
            .map(
              (job) => `
                <button class="job-card ${selectedJob?.id === job.id ? "is-selected" : ""}" data-job-id="${escapeHtml(job.id)}">
                  ${renderJobSummary(job, job.clientName)}
                </button>
              `
            )
            .join("") || renderEmpty("該当する求人が見つかりません")}
        </div>
      </div>

      <aside class="panel match-panel">
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

  return `
    <section class="section-heading">
      <div>
        <p class="eyebrow">Client CRM</p>
        <h3>取引企業 ${filteredClients.length} 社</h3>
      </div>
      <span class="hint">求人、契約条件、担当者接点を企業単位で確認します。</span>
    </section>
    <section class="client-grid">
      ${filteredClients.map(renderClientCard).join("") || renderEmpty("該当する企業が見つかりません")}
    </section>
  `;
}

function renderPipeline() {
  const groups = groupCandidatesByStage(candidates, pipelineStages);

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

function renderCandidateCard(candidate) {
  const recommendedJobs = getRecommendedJobs(candidate, jobs, 2);

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
    </div>
  `;
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

render();
