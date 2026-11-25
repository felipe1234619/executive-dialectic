const form = document.querySelector('#decision-form');
const records = document.querySelector('#records');
const versions = document.querySelector('#versions');
const revise = document.querySelector('#revise');
let revision = 0;

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const rationale = values.get('rationale').trim();
  const trigger = values.get('trigger').trim();

  for (const [name, value] of [['rationale', rationale], ['trigger', trigger]]) {
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
  document.querySelector('#record-button').textContent = 'Record simulated revision';
  form.querySelector('input:checked').focus();
});
