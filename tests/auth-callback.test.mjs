import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCallback, sanitizeCallbackUrl } from '../auth/callback-core.mjs';
test('PKCE callback extracts code', () => assert.deepEqual(classifyCallback('https://preview.example/auth/callback.html?code=abc'),{kind:'code',code:'abc'}));
test('expired OTP is treated as error', () => assert.equal(classifyCallback('https://preview.example/auth/callback.html#error=access_denied&error_code=otp_expired').kind,'error'));
test('implicit tokens are not accepted', () => assert.equal(classifyCallback('https://preview.example/auth/callback.html#access_token=secret').kind,'missing'));
test('callback without code denied', () => assert.equal(classifyCallback('https://preview.example/auth/callback.html').kind,'missing'));
test('error takes precedence over code', () => assert.equal(classifyCallback('https://preview.example/auth/callback.html?code=abc&error=invalid').kind,'error'));
test('callback removes tokens and codes from address bar', () => assert.equal(sanitizeCallbackUrl('https://preview.example/auth/callback.html?code=abc#access_token=secret'),'/auth/callback.html'));
