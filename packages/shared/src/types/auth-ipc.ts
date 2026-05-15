/** Payloads for auth IPC — replace when wiring real API. */

export type AuthLoginPayload = {
  email: string;
  password: string;
};

export type AuthLoginData = {
  token: string;
  email: string;
  displayName: string;
};

export type AuthRegisterPayload = {
  email: string;
  password: string;
  displayName: string;
};

/** Same shape as login: new account is signed in immediately (temp DB). */
export type AuthRegisterData = AuthLoginData;

export type AuthForgotPasswordPayload = {
  email: string;
};

/** In-memory demo only: `devTemporaryPassword` is set when a user existed and password was rotated. */
export type AuthForgotPasswordData = {
  message: string;
  devTemporaryPassword?: string;
};
