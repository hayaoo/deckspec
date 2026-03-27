import {
  approveSlide,
  rejectSlide,
  archiveDeck,
  activateDeck,
} from "@deckspec/dsl";

interface ApproveOptions {
  slideIndices?: number[];
  reject?: boolean;
  archive?: boolean;
  activate?: boolean;
}

function parseOptions(args: string[]): ApproveOptions {
  const options: ApproveOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--slide" && args[i + 1]) {
      options.slideIndices = args[i + 1].split(",").map((s) => {
        const n = parseInt(s.trim(), 10);
        if (Number.isNaN(n) || n < 0) {
          throw new Error(`Invalid slide index: "${s.trim()}"`);
        }
        return n;
      });
      i++;
    } else if (arg === "--reject") {
      options.reject = true;
    } else if (arg === "--archive") {
      options.archive = true;
    } else if (arg === "--activate") {
      options.activate = true;
    }
  }

  return options;
}

export async function approveCommand(
  filePath: string,
  extraArgs: string[],
): Promise<void> {
  const options = parseOptions(extraArgs);

  if (options.archive) {
    await archiveDeck(filePath);
    console.log(`Archived deck: ${filePath}`);
    return;
  }

  if (options.activate) {
    await activateDeck(filePath);
    console.log(`Activated deck: ${filePath}`);
    return;
  }

  if (!options.slideIndices || options.slideIndices.length === 0) {
    console.error("Error: Specify slides with --slide <index[,index,...]>");
    console.error("  Or use --archive / --activate for deck lifecycle.");
    process.exit(1);
  }

  for (const index of options.slideIndices) {
    if (options.reject) {
      await rejectSlide(filePath, index);
      console.log(`Rejected slide ${index} in ${filePath}`);
    } else {
      await approveSlide(filePath, index);
      console.log(`Approved slide ${index} in ${filePath}`);
    }
  }
}
