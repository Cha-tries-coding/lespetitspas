function normalizeEnvValue(value: string | undefined) {
  return value?.trim();
}

export function getRequiredEnv(name: string) {
  const value = normalizeEnvValue(process.env[name]);

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

export function getOptionalEnv(name: string) {
  return normalizeEnvValue(process.env[name]);
}