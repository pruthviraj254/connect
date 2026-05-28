import { z } from 'zod';

const voidSchema = z.undefined().optional();

export const schemas = {
  authLogin: z.object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(256),
    rememberSession: z.boolean(),
  }),
  authLogout: voidSchema,
  authGetSession: voidSchema,
  authGetAccessToken: voidSchema,
  authDevSkip: voidSchema,
  appGetMachineId: voidSchema,
  appGetPlatform: voidSchema,
  cdrFetchList: z.object({
    pharmacyId: z.string().min(1).max(64),
    params: z.record(z.union([z.string(), z.number()])),
  }),
};
