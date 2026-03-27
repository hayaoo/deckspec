#!/usr/bin/env node

import { validateCommand } from "./commands/validate.js";
import { renderCommand } from "./commands/render.js";
import { approveCommand } from "./commands/approve.js";
import { lockCommand } from "./commands/lock.js";
import { patternsCommand } from "./commands/patterns.js";
import { devCommand } from "./commands/dev.js";
import { initCommand } from "./commands/init.js";

const USAGE = `
Usage: deckspec <command> [options]

Commands:
  init [dir] [--theme <name>]  Scaffold a new DeckSpec project
  validate <file>           Validate a deck YAML file
  render <file> -o <output> Render a deck YAML file to HTML
  approve <file> [options]  Approve/reject slides or archive/activate decks
  lock <file> [options]     Lock an approved slide as a reusable pattern
  patterns [--theme <name>] List available patterns with schemas
  dev [dir]                 Start dev server with dashboard (port 3002)

Approve options:
  --slide <index[,...]>     Slide indices to approve
  --reject                  Reject (reset to generated) instead of approve
  --archive                 Archive the deck
  --activate                Activate an archived deck

Lock options:
  --slide <index>           Slide index to lock
  --name <pattern-name>     Name for the generated pattern

Options:
  --help                    Show this help message
`.trim();

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case "validate": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: Missing file path.\n");
        console.error("Usage: deckspec validate <file>");
        process.exit(1);
      }
      await validateCommand(filePath);
      break;
    }

    case "render": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: Missing file path.\n");
        console.error("Usage: deckspec render <file> -o <output>");
        process.exit(1);
      }

      const outputFlagIndex = args.indexOf("-o");
      const outputPath = outputFlagIndex !== -1 ? args[outputFlagIndex + 1] : undefined;

      if (!outputPath) {
        console.error("Error: Missing output path. Use -o <output> to specify.\n");
        console.error("Usage: deckspec render <file> -o <output>");
        process.exit(1);
      }

      await renderCommand(filePath, outputPath);
      break;
    }

    case "approve": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: Missing file path.\n");
        console.error("Usage: deckspec approve <file> --slide <index>");
        process.exit(1);
      }
      await approveCommand(filePath, args.slice(2));
      break;
    }

    case "lock": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: Missing file path.\n");
        console.error("Usage: deckspec lock <file> --slide <index> --name <pattern-name>");
        process.exit(1);
      }
      await lockCommand(filePath, args.slice(2));
      break;
    }

    case "patterns": {
      await patternsCommand(args.slice(1));
      break;
    }

    case "dev": {
      let devDir = process.cwd();
      let devPort: number | undefined;
      const devArgs = args.slice(1);
      for (let i = 0; i < devArgs.length; i++) {
        if (devArgs[i] === "--port" && devArgs[i + 1]) {
          devPort = parseInt(devArgs[i + 1], 10);
          i++;
        } else if (!devArgs[i].startsWith("-")) {
          devDir = devArgs[i];
        }
      }
      await devCommand(devDir, { port: devPort });
      break;
    }

    case "init": {
      await initCommand(args.slice(1));
      break;
    }

    default: {
      console.error(`Error: Unknown command "${command}".\n`);
      console.log(USAGE);
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
