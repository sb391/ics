const refs = {
  healthPill: document.getElementById("health-pill"),
  metricTotalSubmissions: document.getElementById("metric-total-submissions"),
  metricLabeledSubmissions: document.getElementById("metric-labeled-submissions"),
  metricConversionRate: document.getElementById("metric-conversion-rate"),
  metricScoreGap: document.getElementById("metric-score-gap"),
  postureNote: document.getElementById("posture-note"),
  topRulesList: document.getElementById("top-rules-list"),
  weakestRulesList: document.getElementById("weakest-rules-list"),
  topRulesCount: document.getElementById("top-rules-count"),
  weakestRulesCount: document.getElementById("weakest-rules-count"),
  refreshAnalyticsButton: document.getElementById("refresh-analytics-button"),
  snapshotDate: document.getElementById("snapshot-date"),
  saveSnapshotButton: document.getElementById("save-snapshot-button"),
  snapshotList: document.getElementById("snapshot-list"),
  snapshotDetail: document.getElementById("snapshot-detail"),
  queueFilters: document.getElementById("queue-filters"),
  refreshQueueButton: document.getElementById("refresh-queue-button"),
  queueSummary: document.getElementById("queue-summary"),
  queueList: document.getElementById("queue-list"),
  filterReviewState: document.getElementById("filter-review-state"),
  filterCategory: document.getElementById("filter-category"),
  filterOutcome: document.getElementById("filter-outcome"),
  filterMinScore: document.getElementById("filter-min-score"),
  filterSortBy: document.getElementById("filter-sort-by"),
  filterSortOrder: document.getElementById("filter-sort-order"),
  detailEmpty: document.getElementById("detail-empty"),
  detailShell: document.getElementById("detail-shell"),
  detailSubmissionId: document.getElementById("detail-submission-id"),
  detailCreatedAt: document.getElementById("detail-created-at"),
  detailScore: document.getElementById("detail-score"),
  detailCategory: document.getElementById("detail-category"),
  detailAction: document.getElementById("detail-action"),
  detailOutcome: document.getElementById("detail-outcome"),
  detailVersions: document.getElementById("detail-versions"),
  outcomeForm: document.getElementById("outcome-form"),
  outcomeStatus: document.getElementById("outcome-status"),
  outcomeSource: document.getElementById("outcome-source"),
  outcomeHappenedAt: document.getElementById("outcome-happened-at"),
  outcomeNote: document.getElementById("outcome-note"),
  outcomeSubmit: document.getElementById("outcome-submit"),
  outcomeJourney: document.getElementById("outcome-journey"),
  outcomeHistory: document.getElementById("outcome-history"),
  ruleTraceCount: document.getElementById("rule-trace-count"),
  ruleContributionList: document.getElementById("rule-contribution-list"),
  breakdownBars: document.getElementById("breakdown-bars"),
  answerGrid: document.getElementById("answer-grid"),
  normalizedGrid: document.getElementById("normalized-grid"),
  behaviourGrid: document.getElementById("behaviour-grid"),
  rawPayloadJson: document.getElementById("raw-payload-json"),
  toast: document.getElementById("toast")
};

const state = {
  config: null,
  liveAnalytics: null,
  snapshots: [],
  selectedSnapshotId: null,
  submissions: [],
  selectedSubmissionId: null,
  selectedSubmission: null
};

const OUTCOME_OPTIONS = [
  "contacted",
  "qualified",
  "visit_booked",
  "finance_applied",
  "converted",
  "rejected",
  "junk"
];

const BREAKDOWN_MAX = {
  behaviouralScore: 10,
  interactionScore: 15,
  demandScore: 25,
  consistencyScore: 25,
  readinessScore: 25
};

document.addEventListener("DOMContentLoaded", () => {
  refs.snapshotDate.value = todayDate();
  refs.outcomeSource.value = "manual_review";
  bindEvents();
  initialize();
});

function bindEvents() {
  refs.refreshAnalyticsButton.addEventListener("click", () => refreshAnalytics());
  refs.saveSnapshotButton.addEventListener("click", () => saveSnapshot());
  refs.refreshQueueButton.addEventListener("click", () => loadQueue());
  refs.queueFilters.addEventListener("submit", (event) => {
    event.preventDefault();
    loadQueue();
  });
  refs.outcomeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    appendOutcome();
  });
}

async function initialize() {
  try {
    await Promise.all([checkHealth(), loadConfig()]);
    populateFilterOptions();
    populateOutcomeOptions();
    await Promise.all([refreshAnalytics(), loadSnapshots(), loadQueue()]);
  } catch (error) {
    showToast(error.message || "Failed to load review queue.");
  }
}

async function checkHealth() {
  try {
    await fetchJson("/api/v1/health");
    refs.healthPill.textContent = "API healthy";
    refs.healthPill.className = "pill pill-ok";
  } catch {
    refs.healthPill.textContent = "API unavailable";
    refs.healthPill.className = "pill pill-bad";
  }
}

async function loadConfig() {
  state.config = await fetchJson("/api/v1/config/auto");
}

function populateFilterOptions() {
  if (!state.config) {
    return;
  }

  populateSelect(
    refs.filterCategory,
    state.config.scoreBands.map((band) => band.slug),
    "Any"
  );
  populateSelect(refs.filterOutcome, OUTCOME_OPTIONS, "Any");
}

function populateOutcomeOptions() {
  populateSelect(refs.outcomeStatus, OUTCOME_OPTIONS, "Select outcome");
}

function populateSelect(select, values, emptyLabel) {
  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = emptyLabel;
  select.appendChild(emptyOption);

  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = formatEnum(value);
    select.appendChild(option);
  }
}

async function refreshAnalytics() {
  state.liveAnalytics = await fetchJson("/api/v1/analytics/validation");
  renderAnalytics();
}

async function saveSnapshot() {
  setLoading(refs.saveSnapshotButton, true, "Saving...");

  try {
    const snapshot = await fetchJson("/api/v1/analytics/validation/snapshots", {
      method: "POST",
      body: JSON.stringify({
        snapshotDate: refs.snapshotDate.value || undefined
      })
    });

    showToast(`Saved snapshot for ${snapshot.snapshotDate}.`);
    await Promise.all([loadSnapshots(snapshot.id), refreshAnalytics()]);
  } catch (error) {
    showToast(error.message || "Failed to save snapshot.");
  } finally {
    setLoading(refs.saveSnapshotButton, false, "Save daily snapshot");
  }
}

async function loadSnapshots(preferredId) {
  const response = await fetchJson("/api/v1/analytics/validation/snapshots");
  state.snapshots = response.data || [];

  renderSnapshotList();

  const snapshotToSelect =
    preferredId ||
    state.selectedSnapshotId ||
    state.snapshots[0]?.id ||
    null;

  if (snapshotToSelect) {
    await selectSnapshot(snapshotToSelect);
  } else {
    state.selectedSnapshotId = null;
    refs.snapshotDetail.className = "snapshot-detail empty";
    refs.snapshotDetail.textContent = "No saved snapshot selected.";
  }
}

async function selectSnapshot(snapshotId) {
  state.selectedSnapshotId = snapshotId;
  renderSnapshotList();

  try {
    const snapshot = await fetchJson(`/api/v1/analytics/validation/snapshots/${snapshotId}`);
    renderSnapshotDetail(snapshot);
  } catch (error) {
    showToast(error.message || "Failed to load snapshot.");
  }
}

function renderSnapshotList() {
  refs.snapshotList.innerHTML = "";

  if (state.snapshots.length === 0) {
    refs.snapshotList.appendChild(buildEmptyCard("No daily snapshots saved yet."));
    return;
  }

  for (const snapshot of state.snapshots) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `snapshot-item${snapshot.id === state.selectedSnapshotId ? " active" : ""}`;
    button.addEventListener("click", () => selectSnapshot(snapshot.id));

    const rate =
      snapshot.labeledSubmissions === 0
        ? "--"
        : `${Math.round((snapshot.convertedSubmissions / snapshot.labeledSubmissions) * 100)}%`;

    button.innerHTML = `
      <div class="snapshot-item-head">
        <strong>${snapshot.snapshotDate}</strong>
        <span class="count-pill">${snapshot.totalSubmissions} scored</span>
      </div>
      <div class="snapshot-item-meta">
        <span>${snapshot.labeledSubmissions} labeled</span>
        <span>${rate} conversion</span>
      </div>
    `;

    refs.snapshotList.appendChild(button);
  }
}

function renderSnapshotDetail(snapshot) {
  const payload = snapshot.payload;
  const strongestRule = payload.topPerformingRules[0]?.ruleCode ?? "No rule signal yet";
  const weakestRule = payload.weakestRules[0]?.ruleCode ?? "No weak rule signal yet";
  refs.snapshotDetail.className = "snapshot-detail";
  refs.snapshotDetail.innerHTML = `
    <strong>${snapshot.snapshotDate}</strong>
    <p class="note-copy">Generated ${formatDateTime(snapshot.generatedAt)}.</p>
    <div class="snapshot-detail-grid">
      <div class="snapshot-stat">
        <span class="metric-label">Converted</span>
        <strong>${payload.dataset.convertedSubmissions}</strong>
      </div>
      <div class="snapshot-stat">
        <span class="metric-label">False positives</span>
        <strong>${payload.falsePositives.count}</strong>
      </div>
      <div class="snapshot-stat">
        <span class="metric-label">False negatives</span>
        <strong>${payload.falseNegatives.count}</strong>
      </div>
    </div>
    <p class="note-copy">Strongest live rule: <strong>${formatEnum(strongestRule)}</strong></p>
    <p class="note-copy">Weakest live rule: <strong>${formatEnum(weakestRule)}</strong></p>
  `;
}

async function loadQueue(preferredSubmissionId) {
  refs.queueSummary.textContent = "Loading review queue...";
  const params = new URLSearchParams({
    page: "1",
    pageSize: "100",
    sortBy: refs.filterSortBy.value,
    sortOrder: refs.filterSortOrder.value
  });

  if (refs.filterReviewState.value) {
    params.set("reviewState", refs.filterReviewState.value);
  }
  if (refs.filterCategory.value) {
    params.set("category", refs.filterCategory.value);
  }
  if (refs.filterOutcome.value) {
    params.set("outcomeStatus", refs.filterOutcome.value);
  }
  if (refs.filterMinScore.value) {
    params.set("minScore", refs.filterMinScore.value);
  }

  const response = await fetchJson(`/api/v1/submissions?${params.toString()}`);
  state.submissions = response.data || [];

  renderQueue();

  const submissionToSelect =
    preferredSubmissionId ||
    state.selectedSubmissionId ||
    state.submissions[0]?.id ||
    null;

  if (submissionToSelect && state.submissions.some((submission) => submission.id === submissionToSelect)) {
    await selectSubmission(submissionToSelect);
  } else {
    clearDetail();
  }
}

function renderQueue() {
  refs.queueList.innerHTML = "";
  refs.queueSummary.textContent = `${state.submissions.length} submissions in the current review slice.`;

  if (state.submissions.length === 0) {
    refs.queueList.appendChild(buildEmptyCard("No submissions matched the current review filters."));
    return;
  }

  for (const submission of state.submissions) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `queue-item${submission.id === state.selectedSubmissionId ? " active" : ""}`;
    item.addEventListener("click", () => selectSubmission(submission.id));

    item.innerHTML = `
      <div class="queue-item-head">
        <strong>${submission.totalScore} · ${escapeHtml(submission.category)}</strong>
        ${buildOutcomeBadge(submission.currentOutcomeStatus)}
      </div>
      <div class="queue-item-meta">
        <span>${escapeHtml(formatEnum(submission.purchaseReason || "not_provided"))}</span>
        <span>${escapeHtml(formatEnum(submission.bodyStyle || "not_provided"))}</span>
      </div>
      <div class="queue-item-meta">
        <span>${escapeHtml(formatDateTime(submission.createdAt))}</span>
        <span>${escapeHtml(submission.id)}</span>
      </div>
    `;

    refs.queueList.appendChild(item);
  }
}

async function selectSubmission(submissionId) {
  state.selectedSubmissionId = submissionId;
  renderQueue();

  try {
    state.selectedSubmission = await fetchJson(`/api/v1/submissions/${submissionId}`);
    renderDetail();
  } catch (error) {
    showToast(error.message || "Failed to load submission detail.");
  }
}

function renderAnalytics() {
  const analytics = state.liveAnalytics;
  if (!analytics) {
    return;
  }

  refs.metricTotalSubmissions.textContent = String(analytics.dataset.totalSubmissions);
  refs.metricLabeledSubmissions.textContent = String(analytics.dataset.labeledSubmissions);
  refs.metricConversionRate.textContent =
    analytics.dataset.labeledSubmissions === 0
      ? "--"
      : `${Math.round((analytics.dataset.convertedSubmissions / analytics.dataset.labeledSubmissions) * 100)}%`;

  if (
    analytics.averageScoreComparison.converted === null ||
    analytics.averageScoreComparison.nonConverted === null
  ) {
    refs.metricScoreGap.textContent = "--";
  } else {
    const gap =
      analytics.averageScoreComparison.converted - analytics.averageScoreComparison.nonConverted;
    refs.metricScoreGap.textContent = `${gap >= 0 ? "+" : ""}${gap.toFixed(1)}`;
  }

  refs.postureNote.textContent = analytics.posture.note;
  refs.topRulesCount.textContent = String(analytics.topPerformingRules.length);
  refs.weakestRulesCount.textContent = String(analytics.weakestRules.length);
  renderRuleSummaryList(refs.topRulesList, analytics.topPerformingRules, "positive");
  renderRuleSummaryList(refs.weakestRulesList, analytics.weakestRules, "negative");
}

function renderRuleSummaryList(container, rules, tone) {
  container.innerHTML = "";

  if (!rules || rules.length === 0) {
    container.appendChild(buildEmptyCard("Not enough labeled data yet."));
    return;
  }

  for (const rule of rules.slice(0, 5)) {
    const item = document.createElement("li");
    item.className = "rule-item";
    item.innerHTML = `
      <div class="rule-item-header">
        <strong>${escapeHtml(formatEnum(rule.ruleCode))}</strong>
        <span class="rule-points ${tone === "positive" ? "positive" : "negative"}">
          ${rule.conversionLift === null ? "--" : `${rule.conversionLift >= 0 ? "+" : ""}${rule.conversionLift}`}
        </span>
      </div>
      <div class="rule-meta">
        Fired ${rule.firedCount} times · ${rule.layer} · ${rule.conversionRate === null ? "--" : `${Math.round(rule.conversionRate * 100)}%`} conversion
      </div>
    `;
    container.appendChild(item);
  }
}

function renderDetail() {
  const submission = state.selectedSubmission;

  if (!submission) {
    clearDetail();
    return;
  }

  refs.detailEmpty.hidden = true;
  refs.detailShell.hidden = false;
  refs.detailSubmissionId.textContent = submission.submissionId;
  refs.detailCreatedAt.textContent = `Created ${formatDateTime(submission.createdAt)} · Updated ${formatDateTime(submission.updatedAt)}`;
  refs.detailScore.textContent = String(submission.totalScore);
  refs.detailCategory.textContent = submission.category;
  refs.detailCategory.className = `status-pill ${bandTone(submission.category)}`;
  refs.detailAction.textContent = submission.recommendedAction;
  refs.detailOutcome.textContent = formatEnum(submission.outcomeSummary.latestStatus || "unlabeled");
  refs.detailVersions.textContent = `${submission.scoreVersion} / ${submission.weightVersion} / ${submission.ruleSetVersion}`;
  refs.outcomeJourney.textContent = `${submission.outcomes.length} event${submission.outcomes.length === 1 ? "" : "s"}`;
  refs.ruleTraceCount.textContent = String(submission.ruleContributions.length);
  refs.rawPayloadJson.textContent = JSON.stringify(submission.rawPayload, null, 2);

  renderOutcomeHistory(submission.outcomes);
  renderBreakdown(submission.breakdown);
  renderKeyGrid(refs.answerGrid, submission.answers);
  renderKeyGrid(refs.normalizedGrid, submission.normalizedAnswers);
  renderKeyGrid(refs.behaviourGrid, submission.behaviouralMetrics);
  renderContributionList(submission.ruleContributions);
}

function renderOutcomeHistory(outcomes) {
  refs.outcomeHistory.innerHTML = "";

  if (!outcomes || outcomes.length === 0) {
    refs.outcomeHistory.appendChild(buildEmptyCard("No manual or CRM outcomes have been appended yet."));
    return;
  }

  for (const outcome of outcomes) {
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.innerHTML = `
      <strong>${escapeHtml(formatEnum(outcome.status))}</strong>
      <div class="timeline-meta">${escapeHtml(formatDateTime(outcome.happenedAt))}</div>
      <div class="timeline-meta">${escapeHtml(outcome.source || "manual_review")}</div>
      ${outcome.note ? `<div class="timeline-meta">${escapeHtml(outcome.note)}</div>` : ""}
    `;
    refs.outcomeHistory.appendChild(item);
  }
}

function renderBreakdown(breakdown) {
  refs.breakdownBars.innerHTML = "";

  Object.entries(breakdown).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";
    const max = BREAKDOWN_MAX[key] || 100;
    const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
    row.innerHTML = `
      <strong>${escapeHtml(formatEnum(key.replace(/Score$/, "")))}</strong>
      <div class="breakdown-track">
        <div class="breakdown-fill" style="width: ${percent}%"></div>
      </div>
      <span>${value}/${max}</span>
    `;
    refs.breakdownBars.appendChild(row);
  });
}

function renderContributionList(contributions) {
  refs.ruleContributionList.innerHTML = "";

  if (!contributions || contributions.length === 0) {
    refs.ruleContributionList.appendChild(buildEmptyCard("No rule contributions were stored."));
    return;
  }

  const ordered = [...contributions].sort((left, right) => Math.abs(right.points) - Math.abs(left.points));

  for (const contribution of ordered) {
    const item = document.createElement("li");
    item.className = "rule-item";

    const tags = [
      `<span class="tag">${escapeHtml(contribution.layer)}</span>`,
      ...contribution.signalCategories.map((category) => `<span class="tag">${escapeHtml(formatEnum(category))}</span>`)
    ].join("");

    item.innerHTML = `
      <div class="rule-item-header">
        <strong>${escapeHtml(formatEnum(contribution.ruleCode))}</strong>
        <span class="rule-points ${contribution.points >= 0 ? "positive" : "negative"}">
          ${contribution.points >= 0 ? "+" : ""}${contribution.points}
        </span>
      </div>
      <div class="rule-tags">${tags}</div>
      <div class="rule-meta">${escapeHtml(contribution.reason)}</div>
    `;

    refs.ruleContributionList.appendChild(item);
  }
}

function renderKeyGrid(container, values) {
  container.innerHTML = "";

  const entries = Object.entries(values || {}).filter(([, value]) => value !== undefined && value !== null && value !== "");

  if (entries.length === 0) {
    container.appendChild(buildEmptyCard("No structured values were captured."));
    return;
  }

  for (const [key, value] of entries) {
    const card = document.createElement("div");
    card.className = "key-card";
    card.innerHTML = `
      <strong>${escapeHtml(formatEnum(key))}</strong>
      <span>${escapeHtml(formatValue(value))}</span>
    `;
    container.appendChild(card);
  }
}

async function appendOutcome() {
  if (!state.selectedSubmissionId) {
    showToast("Select a submission before appending an outcome.");
    return;
  }

  if (!refs.outcomeStatus.value) {
    showToast("Choose an outcome status first.");
    return;
  }

  setLoading(refs.outcomeSubmit, true, "Saving...");

  try {
    const payload = {
      status: refs.outcomeStatus.value,
      source: refs.outcomeSource.value.trim() || undefined,
      note: refs.outcomeNote.value.trim() || undefined,
      happenedAt: refs.outcomeHappenedAt.value
        ? new Date(refs.outcomeHappenedAt.value).toISOString()
        : undefined
    };

    state.selectedSubmission = await fetchJson(`/api/v1/submissions/${state.selectedSubmissionId}/outcomes`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    refs.outcomeStatus.value = "";
    refs.outcomeNote.value = "";
    refs.outcomeHappenedAt.value = "";
    renderDetail();
    await Promise.all([loadQueue(state.selectedSubmissionId), refreshAnalytics()]);
    showToast("Outcome appended and analytics refreshed.");
  } catch (error) {
    showToast(error.message || "Failed to append outcome.");
  } finally {
    setLoading(refs.outcomeSubmit, false, "Append outcome");
  }
}

function clearDetail() {
  state.selectedSubmission = null;
  state.selectedSubmissionId = null;
  refs.detailEmpty.hidden = false;
  refs.detailShell.hidden = true;
}

function buildOutcomeBadge(status) {
  if (!status) {
    return '<span class="status-pill neutral">Unlabeled</span>';
  }

  const tone = status === "converted" ? "positive" : status === "rejected" || status === "junk" ? "negative" : "warning";
  return `<span class="status-pill ${tone}">${escapeHtml(formatEnum(status))}</span>`;
}

function bandTone(label) {
  if (label === "High Intent Buyer" || label === "Serious Buyer") {
    return "positive";
  }
  if (label === "Casual Browser") {
    return "negative";
  }
  return "warning";
}

function buildEmptyCard(message) {
  const element = document.createElement("div");
  element.className = "empty-card";
  element.textContent = message;
  return element;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }

  return payload;
}

function extractErrorMessage(payload) {
  const details = payload?.error?.details;

  if (Array.isArray(details) && details.length > 0) {
    const first = details[0];
    if (first?.path?.length) {
      return `${first.path.join(".")}: ${first.message}`;
    }
    if (first?.message) {
      return first.message;
    }
  }

  return payload?.error?.message || "Request failed";
}

function showToast(message) {
  refs.toast.hidden = false;
  refs.toast.textContent = message;
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    refs.toast.hidden = true;
  }, 2600);
}

function setLoading(button, isLoading, label) {
  button.disabled = isLoading;
  button.textContent = label;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatEnum(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => formatValue(entry)).join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return formatEnum(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
