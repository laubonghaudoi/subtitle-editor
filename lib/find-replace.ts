import { escapeRegExp } from "./utils";

export interface FindRegexOptions {
  isCaseSensitive: boolean;
  isMatchFullWord: boolean;
  isRegexMode: boolean;
}

export interface FindRegexConfig {
  source: string;
  flags: string;
}

export function getFindRegexConfig(
  findText: string,
  options: FindRegexOptions
): FindRegexConfig | null {
  if (!findText) {
    return null;
  }

  const flags = options.isCaseSensitive ? "g" : "gi";

  try {
    if (options.isRegexMode) {
      // Validate user supplied pattern before returning config
      new RegExp(findText, flags);
      return { source: findText, flags };
    }

    const safePattern = options.isMatchFullWord
      ? `\\b${escapeRegExp(findText)}\\b`
      : escapeRegExp(findText);

    new RegExp(safePattern, flags);
    return { source: safePattern, flags };
  } catch {
    return null;
  }
}

export function createFindRegexFromConfig(
  config: FindRegexConfig | null
): RegExp | null {
  if (!config) {
    return null;
  }

  try {
    return new RegExp(config.source, config.flags);
  } catch {
    return null;
  }
}
