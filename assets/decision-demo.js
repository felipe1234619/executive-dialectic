const form = document.querySelector('#decision-form');
const records = document.querySelector('#records');
const versions = document.querySelector('#versions');
const revise = document.querySelector('#revise');
const recordButton = document.querySelector('#record-button');
const revisionReasonField = document.querySelector('#revision-reason-field');
const revisionReasonInput = document.querySelector('#revision-reason');
const download = document.querySelector('#download-record');
const evidence = [...document.querySelectorAll('#case-evidence li')].map(item => item.textContent.trim());
const dissent = document.querySelector('#case-dissent').textContent.trim();
const history = [];
let exportUrl;

function updateDownload() {
  const report = [
    'Executive Dialectic™ | Fictional decision record',
    'Question: Should we enter the Chilean market?',
    'Authority: Executive committee (fictional)',
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

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const rationale = values.get('rationale').trim();
  const trigger = values.get('trigger').trim();

  const requiredText = [['rationale', rationale], ['trigger', trigger]];
  const revisionReason = values.get('revision-reason')?.trim();
  if (history.length > 0) requiredText.push(['revision-reason', revisionReason]);

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
  }
  const details = [
    ['Recorded at (UTC)', new Date().toISOString()],
    ['Judgment', decision],
    ['Rationale', rationale],
    ...(revisionReason ? [
      ['Reason for revision', revisionReason],
      ['Changes from revision ' + previous.number, changes.join(' ') || 'Judgment, rationale and conditions reaffirmed.'],
    ] : []),
    ['Reconsideration', trigger],
  ];
  history.push({ number, decision, rationale, trigger, details });
  updateDownload();

  const article = document.createElement('article');
  const title = document.createElement('h3');
  title.textContent = 'Revision ' + number;
  article.append(title);

  const detailList = document.createElement('dl');
  for (const [label, value] of details) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    detailList.append(term, description);
  }

  article.append(detailList);
  versions.prepend(article);
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
  revisionReasonInput.focus();
});

document.querySelector('#decision-fields').disabled = false;
recordButton.disabled = false;
document.querySelector('#decision-unavailable').hidden = true;
form.hidden = false;
