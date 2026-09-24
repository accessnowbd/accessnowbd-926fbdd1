import fs from 'node:fs';
import path from 'node:path';

// Fixes Windows path normalization bug in @lovable.dev/mcp-js where Vite config.root uses "/"
// but path.resolve produces "\\" on Windows, causing assertContains() to falsely fail.
const filesToPatch = [
  path.join(process.cwd(), 'node_modules', '@lovable.dev', 'mcp-js', 'dist', 'stacks', 'tanstack', 'vite.js'),
  path.join(process.cwd(), 'node_modules', '@lovable.dev', 'mcp-js', 'dist', 'stacks', 'tanstack', 'vite.cjs'),
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const oldEsm = `function assertContains(parent, child, label) {
  if (child !== parent && !child.startsWith(parent + sep)) {
    throw new Error(\`@lovable.dev/mcp-js: \${label} must resolve under \${parent}, got \${child}\`);
  }
}`;
  const newEsm = `function assertContains(parent, child, label) {
  const normParent = normalizePath(resolve(parent));
  const normChild = normalizePath(resolve(child));
  if (normChild !== normParent && !normChild.startsWith(normParent + "/")) {
    throw new Error(\`@lovable.dev/mcp-js: \${label} must resolve under \${parent}, got \${child}\`);
  }
}`;

  const oldCjs = `function assertContains(parent, child, label) {
  if (child !== parent && !child.startsWith(parent + import_node_path.sep)) {
    throw new Error(\`@lovable.dev/mcp-js: \${label} must resolve under \${parent}, got \${child}\`);
  }
}`;
  const newCjs = `function assertContains(parent, child, label) {
  const normParent = normalizePath((0, import_node_path.resolve)(parent));
  const normChild = normalizePath((0, import_node_path.resolve)(child));
  if (normChild !== normParent && !normChild.startsWith(normParent + "/")) {
    throw new Error(\`@lovable.dev/mcp-js: \${label} must resolve under \${parent}, got \${child}\`);
  }
}`;

  if (content.includes(oldEsm)) {
    content = content.replace(oldEsm, newEsm);
    changed = true;
  }
  if (content.includes(oldCjs)) {
    content = content.replace(oldCjs, newCjs);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-lovable-mcp] Successfully patched ${path.relative(process.cwd(), filePath)}`);
  }
}
