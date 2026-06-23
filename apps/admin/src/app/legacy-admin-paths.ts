import { ADMIN_HOME_PATH } from "../config";
import { resourceConfigList, type ResourceConfig } from "../lib/resource-config";

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function resolveResourcePath(config: ResourceConfig, suffix: string) {
  const normalizedSuffix = normalizePath(suffix);

  if (normalizedSuffix === "/") {
    return config.shellPath;
  }

  if (normalizedSuffix === "/create") {
    return config.supportsCreate ? `${config.shellPath}/new` : config.shellPath;
  }

  const showMatch = normalizedSuffix.match(/^\/([^/]+)\/show$/);
  if (showMatch) {
    return config.supportsShow ? `${config.shellPath}/${showMatch[1]}` : config.shellPath;
  }

  const entityMatch = normalizedSuffix.match(/^\/([^/]+)$/);
  if (!entityMatch) return null;

  const entityId = entityMatch[1];
  if (config.supportsEdit && config.supportsShow) {
    return `${config.shellPath}/${entityId}/edit`;
  }
  if (config.supportsEdit) {
    return `${config.shellPath}/${entityId}/edit`;
  }
  if (config.supportsShow) {
    return `${config.shellPath}/${entityId}`;
  }

  return config.shellPath;
}

export function resolveLegacyAdminPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/" || normalizedPath === ADMIN_HOME_PATH) {
    return "/shell/dashboard";
  }

  for (const config of resourceConfigList) {
    for (const legacyPrefix of config.legacyPrefixes) {
      const normalizedPrefix = normalizePath(legacyPrefix);
      if (
        normalizedPath !== normalizedPrefix &&
        !normalizedPath.startsWith(`${normalizedPrefix}/`)
      ) {
        continue;
      }

      const suffix = normalizedPath.slice(normalizedPrefix.length) || "/";
      return resolveResourcePath(config, suffix);
    }
  }

  return null;
}

export function buildLegacyAdminRedirectTarget(
  pathname: string,
  search = "",
  hash = "",
) {
  const resolvedPath = resolveLegacyAdminPath(pathname) ?? "/shell/dashboard";
  return `${resolvedPath}${search}${hash}`;
}
