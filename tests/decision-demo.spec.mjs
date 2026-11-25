import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const demo = 'http://127.0.0.1:8765/demo.html';

test('the form stays unavailable if the script fails to load', async ({ page }) => {
  await page.route('**/decision-demo.js*', route => route.abort());
  await page.goto(demo);
  await expect(page.locator('#decision-unavailable')).toBeVisible();
  await expect(page.locator('#decision-form')).toBeHidden();
  await expect(page.locator('#rationale')).toBeDisabled();
  await expect(page.locator('#record-button')).toBeDisabled();
  await expect(page).toHaveURL(demo);
});

test('a revision requires its own reason and preserves the original record', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(demo);
  await expect(page.locator('#decision-unavailable')).toBeHidden();
  await expect(page.getByLabel('What prompted this revision?')).toBeHidden();

  await page.getByLabel('Run a limited pilot through a partner').check();
  await page.getByLabel('Rationale and response to dissent').fill('Limit exposure with a pilot.');
  await page.getByLabel('When should the committee reconsider?').fill('Review after 90 days.');
  await page.getByLabel('Who is responsible for reopening the decision?').fill('Committee secretary schedules the review.');
  await page.getByRole('button', { name: 'Record simulated decision' }).click();
  await expect(page.locator('#versions article')).toHaveCount(1);

  await page.getByRole('button', { name: 'Begin revision' }).click();
  const reason = page.getByLabel('What prompted this revision?');
  await expect(reason).toBeFocused();
  await page.getByLabel('Defer expansion pending further evidence').check();
  await page.getByLabel('Rationale and response to dissent').fill('Wait for a new partner quote.');
  await page.getByRole('button', { name: 'Record simulated revision' }).click();
  await expect(page.locator('#versions article')).toHaveCount(1);
  await reason.fill('   ');
  await page.getByRole('button', { name: 'Record simulated revision' }).click();
  await expect(page.locator('#versions article')).toHaveCount(1);
  await reason.fill('The partner withdrew its cost estimate.');
  await page.getByRole('button', { name: 'Record simulated revision' }).click();
  await expect(page.locator('#versions article')).toHaveCount(1);
  await page.getByLabel('What happens to the previous decision?').fill('Suspend the pilot. Keep the cost ceiling and require signed commitments before expansion.');
  await page.getByLabel('What evidence or assumption supports the revision?').fill('Fictional partner notice Chile-02, dated 25 November.');
  await page.getByLabel('When should the committee reconsider?').fill('Reopen after two quotes include local invoicing, support and contract review.');
  await page.getByLabel('Who is responsible for reopening the decision?').fill('Procurement lead checks the quotes and asks the committee to reconvene.');
  await page.getByRole('button', { name: 'Record simulated revision' }).click();

  await expect(page.locator('#versions article')).toHaveCount(2);
  await expect(page.locator('#versions article').first()).toContainText('The partner withdrew its cost estimate.');
  await expect(page.locator('#versions article').last()).toContainText('Limit exposure with a pilot.');
  await expect(page.locator('#versions article').last()).not.toContainText('Reason for revision');
  await expect(page.locator('#versions article').first()).toContainText('Judgment changed from Run a limited pilot to Defer expansion.');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download decision record' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('executive-dialectic-chile-decision.txt');
  const report = await readFile(await download.path(), 'utf8');
  expect(report).toContain('Executive committee (fictional)');
  expect(report).toContain('Six of ten interviewed buyers');
  expect(report).toContain('Finance director.');
  expect(report).toContain('Limit exposure with a pilot.');
  expect(report).toContain('The partner withdrew its cost estimate.');
  expect(report).toContain('Effect on previous decision: Suspend the pilot.');
  expect(report).toContain('Evidence or assumption reference: Fictional partner notice Chile-02');
  expect(report).toContain('Reconsideration criteria: Reopen after two quotes');
  expect(report).toContain('Reconsideration owner: Procurement lead');
  expect(report).toContain('Reconsideration owner: Committee secretary');
  expect(report.indexOf('Revision 1')).toBeLessThan(report.indexOf('Revision 2'));
  await expect(page).toHaveURL(demo);
  await page.getByRole('button', { name: 'Begin revision' }).click();
  await expect(reason).toHaveValue('');
  await expect(page.getByLabel('What happens to the previous decision?')).toHaveValue('');
  await expect(page.getByLabel('What evidence or assumption supports the revision?')).toHaveValue('');
});
