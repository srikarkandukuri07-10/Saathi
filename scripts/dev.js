#!/usr/bin/env node
/**
 * Starts the Next.js dev server on the first port that is genuinely free.
 *
 * Why this exists: on a shared machine another local service often holds
 * 127.0.0.1:3000. Next.js then binds the wildcard address 0.0.0.0:3000
 * anyway, which silently splits traffic - requests to 127.0.0.1 reach the
 * other application while requests to ::1 or localhost reach Next.js.
 *
 * The port is probed on both loopback families before it is used, so the dev
 * server always lands on a port that belongs to it alone.
 *
 * Usage: npm run dev        (honours the PORT env var when it is set)
 */

const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const START_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT = START_PORT + 20;

/**
 * Tries to bind a port on one address.
 * Resolves to true when the bind succeeded, meaning the port was free.
 *
 * Binding is used instead of connecting: on Windows a wildcard bind
 * (0.0.0.0) succeeds even when another process already holds the same port
 * on 127.0.0.1, which is exactly the split-brain this script avoids.
 */
function canBind(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      server.close(() => resolve(false));
      if (error.code !== "EADDRINUSE" && error.code !== "EACCES") {
        // Any other error still means we cannot safely claim the port.
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen({ host, port, exclusive: true });
  });
}

/** A port is unusable when it cannot be bound on either loopback family. */
async function isPortInUse(port) {
  const results = await Promise.all([
    canBind("127.0.0.1", port),
    canBind("::1", port),
  ]);

  // Both addresses must be claimable, otherwise another local service owns
  // part of that port and traffic would be split between the two apps.
  return !results.every(Boolean);
}

async function findFreePort() {
  for (let port = START_PORT; port < MAX_PORT; port++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    console.log(`> Port ${port} is already in use by another local service.`);
  }
  throw new Error(`No free port found between ${START_PORT} and ${MAX_PORT}.`);
}

async function main() {
  const port = await findFreePort();
  const url = `http://localhost:${port}`;

  if (port !== START_PORT) {
    const width = 64;
    const line = (text) => `| ${text.padEnd(width - 4)} |`;
    const bar = `+${"-".repeat(width)}+`;

    console.log("");
    console.log(bar);
    console.log(line("OPEN THE APP AT: " + url));
    console.log(line(""));
    console.log(line(`Port ${START_PORT} belongs to another local application, so the`));
    console.log(line("dev server moved. Requests to port 3000 will NOT reach"));
    console.log(line("Hackpact. Use the URL above."));
    console.log(bar);
    console.log("");
  } else {
    console.log(`> Hackpact dev server -> ${url}`);
  }

  const nextBin = path.join(
    __dirname,
    "..",
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      // NEXT_PUBLIC_* values are inlined into the client bundle at compile
      // time, so the app is told about the port it is actually served on.
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || url,
    },
  });

  const forward = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));

  child.on("exit", (code, signal) => {
    process.exit(signal ? 1 : code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
