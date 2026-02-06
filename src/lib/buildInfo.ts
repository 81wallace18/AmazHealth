export interface FrontendBuildInfo {
  version: string;
  gitSha: string;
}

export const frontendBuildInfo: FrontendBuildInfo = {
  version: import.meta.env.VITE_APP_VERSION || "dev",
  gitSha: import.meta.env.VITE_APP_GIT_SHA || "unknown",
};
