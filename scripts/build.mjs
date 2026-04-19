import { spawnSync } from "node:child_process";

function run(args) {
  const command = process.platform === "win32" ? "cmd.exe" : "npx";
  const commandArgs =
    process.platform === "win32" ? ["/c", "npx", ...args] : args;
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.RENDER === "true") {
  run(["prisma", "generate"]);
}

run(["next", "build"]);
