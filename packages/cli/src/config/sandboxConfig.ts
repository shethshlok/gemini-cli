/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { SandboxConfig } from '@google/gemini-cli-core';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { getPackageJson } from '../utils/package.js';
import { Settings } from './settings.js';

export async function loadSandboxConfig(
  settings: Settings,
  argv: { sandbox?: boolean | string; 'sandbox-image'?: string },
): Promise<SandboxConfig | undefined> {
  const sandboxOption = argv.sandbox ?? settings.sandbox;
  if (!sandboxOption) {
    return undefined;
  }
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'sandbox_command.js');
  // Invoke shared sandbox_command script to determine sandbox command
  let command = '' as SandboxConfig['command'];
  try {
    const raw = execSync(`node ${scriptPath} -q`, { encoding: 'utf-8' }).trim();
    // raw should be one of the valid commands: 'docker', 'podman', or 'sandbox-exec'
    command = raw as SandboxConfig['command'];
  } catch {
    return undefined;
  }

  const packageJson = await getPackageJson();
  const image =
    argv['sandbox-image'] ??
    process.env.GEMINI_SANDBOX_IMAGE ??
    packageJson?.config?.sandboxImageUri;

  return command && image ? { command, image } : undefined;
}