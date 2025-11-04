import { Amplify } from "aws-amplify";

/**
 * Amplify設定
 *
 * クライアントサイドで実行される設定
 * amplify_outputs.json が自動生成された後、そのファイルをインポート
 */

// 本番環境ではamplify_outputs.jsonから自動生成される設定を使用
// 開発環境では手動設定も可能
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: process.env.S3_BUCKET_NAME || "",
      region: process.env.S3_REGION || "us-east-1",
    },
  },
};

// Amplify設定を適用
export function configureAmplify() {
  if (typeof window !== "undefined") {
    // クライアントサイドでのみ実行
    try {
      // TODO: amplify_outputs.json が生成された後、下記のようにインポート
      // import outputs from "@/amplify_outputs.json";
      // Amplify.configure(outputs);

      // 開発時は手動設定を使用
      Amplify.configure(amplifyConfig);
    } catch (error) {
      console.warn("Amplify configuration not found. Using manual config.");
      Amplify.configure(amplifyConfig);
    }
  }
}

export { amplifyConfig };
