/**
 * MCP Configuration Validator
 *
 * Validates MCP server configurations for syntax, schema compliance,
 * and best practices.
 */

import type {
  MCPConfig,
  ValidationError,
  ValidationResult,
} from './schema';

/**
 * Common MCP server command patterns
 */
const KNOWN_COMMANDS = ['npx', 'node', 'python', 'python3', 'deno', 'bun', 'uvx'];

/**
 * Official Anthropic MCP server packages
 */
const OFFICIAL_PACKAGES = [
  '@anthropic-ai/mcp-server-filesystem',
  '@anthropic-ai/mcp-server-postgres',
  '@anthropic-ai/mcp-server-sqlite',
  '@anthropic-ai/mcp-server-git',
  '@anthropic-ai/mcp-server-github',
  '@anthropic-ai/mcp-server-slack',
  '@anthropic-ai/mcp-server-gdrive',
];

/**
 * Validates an MCP configuration string
 */
export function validateMCPConfig(configString: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let parsedConfig: MCPConfig | undefined;
  let serverCount = 0;

  // 1. JSON syntax validation
  try {
    parsedConfig = JSON.parse(configString);
  } catch (e) {
    const syntaxError = e as SyntaxError;
    const match = syntaxError.message.match(/position (\d+)/);
    const position = match?.[1] ? parseInt(match[1], 10) : undefined;

    // Try to find line number from position
    let line = 1;
    let col = 1;
    if (position !== undefined) {
      const upToError = configString.slice(0, position);
      line = (upToError.match(/\n/g) || []).length + 1;
      col = position - upToError.lastIndexOf('\n');
    }

    errors.push({
      type: 'syntax',
      message: `JSON syntax error: ${syntaxError.message}`,
      line,
      column: col,
      severity: 'error',
    });

    return { valid: false, errors, warnings, serverCount: 0 };
  }

  // 2. Schema validation - check for mcpServers object
  if (!parsedConfig || typeof parsedConfig !== 'object') {
    errors.push({
      type: 'schema',
      message: 'Configuration must be a JSON object',
      severity: 'error',
    });
    return { valid: false, errors, warnings, serverCount: 0 };
  }

  if (!('mcpServers' in parsedConfig)) {
    errors.push({
      type: 'schema',
      message: 'Missing required "mcpServers" property',
      path: 'mcpServers',
      severity: 'error',
    });
    return { valid: false, errors, warnings, serverCount: 0 };
  }

  if (typeof parsedConfig.mcpServers !== 'object' || parsedConfig.mcpServers === null) {
    errors.push({
      type: 'type',
      message: '"mcpServers" must be an object',
      path: 'mcpServers',
      severity: 'error',
    });
    return { valid: false, errors, warnings, serverCount: 0 };
  }

  // 3. Validate each server entry
  const servers = parsedConfig.mcpServers as Record<string, unknown>;
  serverCount = Object.keys(servers).length;

  if (serverCount === 0) {
    warnings.push({
      type: 'warning',
      message: 'No MCP servers defined. Add at least one server to use MCP.',
      path: 'mcpServers',
      severity: 'warning',
    });
  }

  for (const [serverName, serverConfig] of Object.entries(servers)) {
    validateServerEntry(serverName, serverConfig, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    serverCount,
    parsedConfig: errors.length === 0 ? parsedConfig : undefined,
  };
}

/**
 * Validates a single server entry
 */
function validateServerEntry(
  name: string,
  config: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const path = `mcpServers.${name}`;

  // Server config must be an object
  if (typeof config !== 'object' || config === null) {
    errors.push({
      type: 'type',
      message: `Server "${name}" must be an object`,
      path,
      severity: 'error',
    });
    return;
  }

  const serverConfig = config as Record<string, unknown>;

  // Validate server name format
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    warnings.push({
      type: 'format',
      message: `Server name "${name}" contains special characters. Use alphanumeric, hyphens, and underscores only.`,
      path,
      severity: 'warning',
    });
  }

  // Required: command
  if (!('command' in serverConfig)) {
    errors.push({
      type: 'required',
      message: `Server "${name}" missing required "command" field`,
      path: `${path}.command`,
      severity: 'error',
    });
  } else if (typeof serverConfig.command !== 'string') {
    errors.push({
      type: 'type',
      message: `Server "${name}": "command" must be a string`,
      path: `${path}.command`,
      severity: 'error',
    });
  } else if (serverConfig.command.trim() === '') {
    errors.push({
      type: 'format',
      message: `Server "${name}": "command" cannot be empty`,
      path: `${path}.command`,
      severity: 'error',
    });
  } else if (!KNOWN_COMMANDS.includes(serverConfig.command)) {
    warnings.push({
      type: 'warning',
      message: `Server "${name}": Uncommon command "${serverConfig.command}". Common commands: ${KNOWN_COMMANDS.join(', ')}`,
      path: `${path}.command`,
      severity: 'warning',
    });
  }

  // Optional: args
  if ('args' in serverConfig) {
    if (!Array.isArray(serverConfig.args)) {
      errors.push({
        type: 'type',
        message: `Server "${name}": "args" must be an array`,
        path: `${path}.args`,
        severity: 'error',
      });
    } else {
      // Check each arg is a string
      serverConfig.args.forEach((arg, index) => {
        if (typeof arg !== 'string') {
          errors.push({
            type: 'type',
            message: `Server "${name}": args[${index}] must be a string`,
            path: `${path}.args[${index}]`,
            severity: 'error',
          });
        }
      });

      // Check for official packages
      const args = serverConfig.args as string[];
      const hasOfficialPackage = args.some(arg =>
        OFFICIAL_PACKAGES.some(pkg => arg.includes(pkg))
      );
      if (hasOfficialPackage) {
        // This is good - using official package
      }
    }
  }

  // Optional: env
  if ('env' in serverConfig) {
    if (typeof serverConfig.env !== 'object' || serverConfig.env === null) {
      errors.push({
        type: 'type',
        message: `Server "${name}": "env" must be an object`,
        path: `${path}.env`,
        severity: 'error',
      });
    } else {
      const env = serverConfig.env as Record<string, unknown>;
      for (const [envKey, envValue] of Object.entries(env)) {
        if (typeof envValue !== 'string') {
          errors.push({
            type: 'type',
            message: `Server "${name}": env.${envKey} must be a string`,
            path: `${path}.env.${envKey}`,
            severity: 'error',
          });
        } else {
          // Check for unset environment variable placeholders
          const placeholderMatch = envValue.match(/\$\{([^}]+)\}/);
          if (placeholderMatch) {
            const varName = placeholderMatch[1];
            if (varName?.startsWith('YOUR_') || varName === 'API_KEY' || varName === 'TOKEN') {
              warnings.push({
                type: 'warning',
                message: `Server "${name}": Remember to replace \${${varName}} with your actual value or set the environment variable`,
                path: `${path}.env.${envKey}`,
                severity: 'warning',
              });
            }
          }
        }
      }
    }
  }

  // Check for unknown properties
  const knownProps = ['command', 'args', 'env'];
  const unknownProps = Object.keys(serverConfig).filter(k => !knownProps.includes(k));
  if (unknownProps.length > 0) {
    warnings.push({
      type: 'warning',
      message: `Server "${name}": Unknown properties: ${unknownProps.join(', ')}. These will be ignored.`,
      path,
      severity: 'warning',
    });
  }
}

/**
 * Formats MCP config JSON with consistent indentation
 */
export function formatMCPConfig(configString: string): string {
  try {
    const parsed = JSON.parse(configString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return configString;
  }
}

/**
 * Encodes MCP config for URL sharing
 */
export function encodeConfigForURL(config: string): string {
  return btoa(encodeURIComponent(config));
}

/**
 * Decodes MCP config from URL parameter
 */
export function decodeConfigFromURL(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return '';
  }
}
