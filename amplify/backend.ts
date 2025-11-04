import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { storage } from "./storage/resource";

/**
 * Amplify Gen 2 バックエンド定義
 *
 * 以下のリソースを定義:
 * - Cognito認証（チームベースのグループ管理）
 * - S3ストレージ（ログファイル保存）
 */
const backend = defineBackend({
  auth,
  storage,
});

// Bedrock用のIAMポリシーを追加
const bedrockPolicy = {
  Effect: "Allow",
  Action: ["bedrock:InvokeModel"],
  Resource: [
    "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-*",
  ],
};

// S3 Signed URL生成用の権限を追加
const s3Policy = {
  Effect: "Allow",
  Action: ["s3:GetObject", "s3:ListBucket"],
  Resource: [
    `${backend.storage.resources.bucket.bucketArn}`,
    `${backend.storage.resources.bucket.bucketArn}/*`,
  ],
};

// 認証済みユーザーのロールにポリシーを追加
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy({
  name: "bedrock-access",
  policy: bedrockPolicy,
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy({
  name: "s3-signed-url",
  policy: s3Policy,
});
