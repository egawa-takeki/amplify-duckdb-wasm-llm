import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
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
// Amazon Nova Proの推論プロファイルを使用
const bedrockPolicy = new PolicyStatement({
  actions: ["bedrock:InvokeModel"],
  resources: [
    // 推論プロファイル用のARN形式
    "arn:aws:bedrock:*:*:inference-profile/us.amazon.nova-pro-v1:0",
    // 基盤モデルへの直接アクセス用（フォールバック）
    "arn:aws:bedrock:*::foundation-model/amazon.nova-pro-*",
  ],
});

// S3 Signed URL生成用の権限を追加
const s3Policy = new PolicyStatement({
  actions: ["s3:GetObject", "s3:ListBucket"],
  resources: [
    backend.storage.resources.bucket.bucketArn,
    `${backend.storage.resources.bucket.bucketArn}/*`,
  ],
});

// 認証済みユーザーのロールにポリシーを追加
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  bedrockPolicy
);

backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(s3Policy);
