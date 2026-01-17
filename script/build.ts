import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Native modules that must always be external (contain .node binaries)
const nativeModules = [
  "canvas",
  "sharp",
  "bcrypt",
  "sqlite3",
  "better-sqlite3",
  "cpu-features",
  "bufferutil",
  "utf-8-validate",
  "qrcode",
  "whatsapp-web.js",
  "puppeteer",
  "puppeteer-core",
  "pdfjs-dist",
];

// Banner to provide __dirname and __filename for ESM compatibility in CJS bundle
const cjsBanner = `
const __filename = require('url').fileURLToPath(require('url').pathToFileURL(__filename).href);
const __dirname = require('path').dirname(__filename);
`.trim();

// Proper CJS shim for __dirname/__filename
const nodeGlobalsShim = `
const { fileURLToPath: ___fileURLToPath } = require('url');
const { dirname: ___dirname } = require('path');
`;

async function buildAll() {
  // Remove dist relative to the script location to ensure clean builds during deployment
  // Try multiple paths to ensure we always clean the correct directory
  const possibleDistPaths = [
    "dist",
    "PULSE-ERP/dist",
    "../PULSE-ERP/dist",
    path.resolve(__dirname, "..", "dist"),
  ];

  for (const p of possibleDistPaths) {
    try {
      await rm(p, { recursive: true, force: true });
    } catch (e) {
      // Ignore errors - some paths may not exist
    }
  }
  console.log("Cleaned dist directories");

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...nativeModules,
  ];
  console.log("Externals:", externals);

  // Plugin to force drizzle-orm to resolve to CJS entry point to avoid dual package hazard
  const drizzleAliasPlugin = {
    name: "alias-drizzle",
    setup(build: any) {
      build.onResolve({ filter: /^drizzle-orm$/ }, () => {
        return { path: require.resolve('drizzle-orm') }
      });
      build.onResolve({ filter: /^drizzle-orm\/sqlite-core$/ }, () => {
        return { path: require.resolve('drizzle-orm/sqlite-core') }
      });
    }
  };

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    banner: {
      js: `const __bundle_filename = __filename; const __bundle_dirname = __dirname;`,
    },
    mainFields: ['module', 'main'],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
    loader: {
      ".node": "copy",
    },
    plugins: [
      drizzleAliasPlugin,
      {
        name: "native-node-modules",
        setup(build) {
          build.onResolve({ filter: /\.node$/ }, (args) => {
            return { path: args.path, external: true };
          });
        },
      },
    ],
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
