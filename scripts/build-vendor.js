#!/usr/bin/env node
// One-time script to build the self-contained Supabase ESM vendor bundle.
// Run: npm run vendor:build
// Commit the output; re-run on SDK upgrades.
import * as esbuild from 'esbuild'
import { createRequire } from 'module'
import { writeFileSync } from 'fs'

const require = createRequire(import.meta.url)
const pkg = require('@supabase/supabase-js/package.json')
const version = pkg.version

const result = await esbuild.build({
  entryPoints: ['node_modules/@supabase/supabase-js/dist/index.mjs'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  minify: false,
  write: false,
})

const outPath = `assets/js/vendor/supabase-${version}.js`
const banner = `/* vendored @supabase/supabase-js@${version} — built by scripts/build-vendor.js */\n`
writeFileSync(outPath, banner + result.outputFiles[0].text)
console.log(`Wrote ${outPath} (${Math.round(result.outputFiles[0].text.length / 1024)}KB)`)
