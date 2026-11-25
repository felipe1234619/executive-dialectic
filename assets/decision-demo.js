const form = document.querySelector('#decision-form');
const records = document.querySelector('#records');
const versions = document.querySelector('#versions');
const graphVersions = document.querySelector('#decision-graph-versions');
const authority = 'Executive committee (fictional)';
const revise = document.querySelector('#revise');
const recordButton = document.querySelector('#record-button');
const revisionReasonField = document.querySelector('#revision-reason-field');
const revisionReasonInput = document.querySelector('#revision-reason');
const revisionHandoff = document.querySelector('#revision-handoff');
const download = document.querySelector('#download-record');
const evidence = [...document.querySelectorAll('#case-evidence li')].map(item => item.textContent.trim());
const dissent = document.querySelector('#case-dissent').textContent.trim();
const history = [];
let exportUrl;

function updateDownload() {
  const report = [
    'Executive Dialectic™ | Fictional decision record',
    'Question: Should we enter the Chilean market?',
    'Authority: ' + authority,
    '',
    'Evidence and limits',
    ...evidence.map(item => '- ' + item),
    '',
    'Recorded dissent',
    dissent,
    ...history.flatMap(({ number, details }) => [
      '', 'Revision ' + number,
      ...details.map(([label, value]) => label + ': ' + value),
    ]),
  ].join('\n');

  const nextUrl = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
  download.href = nextUrl;
  if (exportUrl) URL.revokeObjectURL(exportUrl);
  exportUrl = nextUrl;
}

function appendDetails(list, details) {
  for (const [label, value] of details) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
  }
}

function appendGraphVersion({ number, decision, previous, revisionReason, evidenceReference }) {
  const node = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#revision-' + number;
  link.textContent = 'Revision ' + number + ' · ' + decision;

  const context = document.createElement('p');
  context.textContent = previous
    ? 'Revises revision ' + previous.number
    : 'Initial judgment based on the evidence and dissent above';
  const details = document.createElement('dl');
  appendDetails(details, [
    ['Decision authority', authority],
    ...(previous ? [
      ['Reason for revision', revisionReason],
      ['Evidence or assumption', evidenceReference],
    ] : []),
  ]);
  node.append(link, context, details);
  graphVersions.append(node);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const rationale = values.get('rationale').trim();
  const trigger = values.get('trigger').trim();

  const reviewOwner = values.get('review-owner').trim();
  const revisionReason = values.get('revision-reason')?.trim();
  const previousEffect = values.get('previous-effect')?.trim();
  const evidenceReference = values.get('evidence-reference')?.trim();
  const requiredText = [['rationale', rationale], ['trigger', trigger], ['review-owner', reviewOwner]];
  if (history.length > 0) {
    requiredText.push(['revision-reason', revisionReason], ['previous-effect', previousEffect], ['evidence-reference', evidenceReference]);
  }

  for (const [name, value] of requiredText) {
    if (value) continue;
    const field = form.elements[name];
    field.value = '';
    field.reportValidity();
    return;
  }

  const previous = history.at(-1);
  const decision = values.get('alternative');
  const number = history.length + 1;
  const changes = [];
  if (previous) {
    if (decision !== previous.decision) changes.push('Judgment changed from ' + previous.decision + ' to ' + decision + '.');
    if (rationale !== previous.rationale) changes.push('Rationale updated.');
    if (trigger !== previous.trigger) changes.push('Reconsideration conditions updated.');
    if (reviewOwner !== previous.reviewOwner) changes.push('Reconsideration owner updated.');
  }
  const details = [
    ['Recorded at (UTC)', new Date().toISOString()],
    ['Judgment', decision],
    ['Rationale', rationale],
    ...(revisionReason ? [
      ['Reason for revision', revisionReason],
      ['Effect on previous decision', previousEffect],
      ['Evidence or assumption reference', evidenceReference],
      ['Changes from revision ' + previous.number, changes.join(' ') || 'Judgment, rationale and reconsideration plan reaffirmed.'],
    ] : []),
    ['Reconsideration criteria', trigger],
    ['Reconsideration owner', reviewOwner],
  ];
  history.push({ number, decision, rationale, trigger, reviewOwner, details });
  updateDownload();

  const article = document.createElement('article');
  const title = document.createElement('h3');
  title.id = 'revision-' + number;
  title.tabIndex = -1;
  title.textContent = 'Revision ' + number;
  article.append(title);

  const detailList = document.createElement('dl');
  appendDetails(detailList, details);

  article.append(detailList);
  versions.prepend(article);
  appendGraphVersion({ number, decision, previous, revisionReason, evidenceReference });
  form.hidden = true;
  records.hidden = false;
  revise.hidden = false;
  document.querySelector('#record-status').textContent = 'Revision ' + number + ' recorded.';
  document.querySelector('#record-title').focus();
});

revise.addEventListener('click', () => {
  form.hidden = false;
  revise.hidden = true;
  recordButton.textContent = 'Record simulated revision';
  revisionReasonField.hidden = false;
  revisionReasonInput.disabled = false;
  revisionReasonInput.required = true;
  revisionReasonInput.value = '';
  revisionHandoff.hidden = false;
  revisionHandoff.disabled = false;
  form.elements['previous-effect'].value = '';
  form.elements['evidence-reference'].value = '';
  revisionReasonInput.focus();
});

document.querySelector('#decision-fields').disabled = false;
recordButton.disabled = false;
document.querySelector('#decision-unavailable').hidden = true;
form.hidden = false;
