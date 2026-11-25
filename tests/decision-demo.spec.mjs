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
  const graph = page.getByRole('region', { name: 'Decision graph' });
  await expect(graph).toBeHidden();
  await expect.poll(() => page.locator('.demo-brand img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);

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
  const nodes = graph.getByRole('listitem');
  await expect(nodes).toHaveCount(2);
  await expect(nodes.first()).toContainText('Initial judgment');
  await expect(nodes.first()).toContainText('Executive committee (fictional)');
  await expect(nodes.last()).toContainText('Revises revision 1');
  await expect(nodes.last()).toContainText('The partner withdrew its cost estimate.');
  await expect(nodes.last()).toContainText('Fictional partner notice Chile-02');
  await expect(graph.getByRole('link', { name: 'Finance director’s dissent' })).toHaveAttribute('href', '#dissent-heading');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
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

  const revisionLink = nodes.last().getByRole('link', { name: 'Revision 2 · Defer expansion' });
  await revisionLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#revision-2$/);
  await expect(page.getByRole('heading', { name: 'Revision 2', exact: true })).toBeFocused();
});

test('the guided case compares both records and leaves the free simulation ready', async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 850 });
  await page.goto(demo);
  const start = page.getByRole('link', { name: 'Start the guided case' });
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'A pilot in Chile' })).toBeFocused();

  const comparison = page.getByRole('group', { name: 'The decision before and after' });
  const original = comparison.getByRole('article', { name: 'Original decision' });
  const revised = comparison.getByRole('article', { name: 'Revised decision' });
  await expect(original).toContainText('Approve a limited pilot');
  await expect(revised).toContainText('Suspend the pilot and defer expansion');
  const desktopOriginal = await original.boundingBox();
  const desktopRevised = await revised.boundingBox();
  expect(desktopRevised.x).toBeGreaterThan(desktopOriginal.x);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOriginal = await original.boundingBox();
  const mobileRevised = await revised.boundingBox();
  expect(mobileRevised.y).toBeGreaterThan(mobileOriginal.y + mobileOriginal.height);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('region', { name: 'A pilot in Chile' })).toContainText('The procurement lead checks');

  await page.getByRole('link', { name: 'Make your own decision' }).click();
  await expect(page).toHaveURL(/#free-simulation$/);
  await expect(page.getByLabel('Rationale and response to dissent')).toHaveValue('');
  await expect(page.locator('#versions article')).toHaveCount(0);
});

test('the operational workflow gates each role and keeps the pilot suspended', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(demo + '#operational-workflow');
  const workflow = page.getByRole('region', { name: 'Who acts after the pilot is suspended?' });
  const procurement = workflow.getByRole('button', { name: 'Record two quotes' });
  const finance = workflow.getByRole('button', { name: 'Record finance review' });
  const committee = workflow.getByRole('button', { name: 'Request reconsideration' });
  const status = workflow.getByRole('status');

  await expect(procurement).toBeEnabled();
  await expect(finance).toBeDisabled();
  await expect(committee).toBeDisabled();
  await procurement.focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('USD 55,000 and USD 58,000');
  await expect(finance).toBeFocused();
  await expect(committee).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('The pilot remains suspended.');
  await expect(committee).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toBeFocused();
  await expect(status).toContainText('The suspension stays in effect');
  await expect(page.locator('#versions article')).toHaveCount(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await workflow.getByRole('button', { name: 'Reset workflow' }).click();
  await expect(procurement).toBeFocused();
  await expect(finance).toBeDisabled();
  await expect(committee).toBeDisabled();
  await expect(status).toContainText('Procurement can collect quotes');
});
