const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  port: toNumber(process.env.PORT, 3000),
  jwtExpiresMinutes: toNumber(process.env.JWT_EXPIRES_MINUTES, 15),
  defaultPageSize: toNumber(process.env.DEFAULT_PAGE_SIZE, 20),
  maxPageSize: toNumber(process.env.MAX_PAGE_SIZE, 50),
  attachmentMaxSizeMb: toNumber(process.env.ATTACHMENT_MAX_SIZE_MB, 10),
  auditRetentionDays: toNumber(process.env.AUDIT_RETENTION_DAYS, 365)
};
