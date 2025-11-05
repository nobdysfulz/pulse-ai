#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const FALLBACK_PROJECT_REF = 'pdbggzsmgcrguhscynnk';
const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.VITE_SUPABASE_PROJECT_ID || FALLBACK_PROJECT_REF;

const deployArgs = ['functions', 'deploy', 'clerkWebhook', '--project-ref', projectRef];

const result = spawnSync('supabase', deployArgs, { stdio: 'inherit' });

if (result.error) {
  console.error('\nFailed to run Supabase CLI. Ensure it is installed (`npm install -g supabase`).');
  console.error(result.error);
  process.exit(result.error.code ?? 1);
}

process.exit(result.status ?? 0);
