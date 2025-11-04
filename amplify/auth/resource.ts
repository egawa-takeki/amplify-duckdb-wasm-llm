import { defineAuth } from "@aws-amplify/backend";

/**
 * Cognito認証設定
 *
 * チームベースのアクセス制御を実装
 * - team-alpha: チームAlphaのログのみ
 * - team-beta: チームBetaのログのみ
 * - team-gamma: チームGammaのログのみ
 * - team-admin: 全チームのログ
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false,
    },
  },
  groups: ["team-alpha", "team-beta", "team-gamma", "team-admin"],
  accountRecovery: "EMAIL",
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
  mfa: {
    mode: "OPTIONAL",
    sms: false,
    totp: true,
  },
});
