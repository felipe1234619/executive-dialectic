const form = document.querySelector('#decision-form');
const records = document.querySelector('#records');
const versions = document.querySelector('#versions');
const revise = document.querySelector('#revise');
const recordButton = document.querySelector('#record-button');
const revisionReasonField = document.querySelector('#revision-reason-field');
const revisionReasonInput = document.querySelector('#revision-reason');
let revision = 0;

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const rationale = values.get('rationale').trim();
  const trigger = values.get('trigger').trim();

  const requiredText = [['rationale', rationale], ['trigger', trigger]];
  const revisionReason = values.get('revision-reason')?.trim();
  if (revision > 0) requiredText.push(['revision-reason', revisionReason]);

  for (const [name, value] of requiredText) {
    if (value) continue;
    const field = form.elements[name];
    field.value = '';
    field.reportValidity();
    return;
  }

  revision += 1;
  const article = document.createElement('article');
  const title = document.createElement('h3');
  title.textContent = 'Revision ' + revision;
  article.append(title);

  const details = document.createElement('dl');
  for (const [label, value] of [
    ['Question', 'Should we enter the Chilean market?'],
    ['Authority', 'Executive committee (fictional)'],
    ['Judgment', values.get('alternative')],
    ['Rationale', rationale],
    ...(revisionReason ? [['Reason for revision', revisionReason]] : []),
    ['Recorded dissent', 'Finance director requested a cost ceiling and signed commitments before expanding.'],
    ['Reconsideration', trigger],
  ]) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    details.append(term, description);
  }

  article.append(details);
  versions.prepend(article);
  form.hidden = true;
  records.hidden = false;
  revise.hidden = false;
  document.querySelector('#record-status').textContent = 'Revision ' + revision + ' recorded.';
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
