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
// Amazon Nova Proモデルへのアクセス権限
const bedrockPolicy = new PolicyStatement({
  actions: ["bedrock:InvokeModel"],
  resources: [
    // Amazon Nova Pro v1:0への直接アクセス
    "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0",
    // 推論プロファイル（リージョン横断アクセス用）
    "arn:aws:bedrock:*:*:inference-profile/us.amazon.nova-pro-v1:0",
    // 他のNova Proバージョンへのアクセス（フォールバック）
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

// 各グループのロールにも同じポリシーを追加
// Cognitoグループごとに個別のIAMロールが作成されるため、それぞれに権限が必要
backend.auth.resources.groups["team-alpha"].role?.addToPrincipalPolicy(
  bedrockPolicy
);
backend.auth.resources.groups["team-alpha"].role?.addToPrincipalPolicy(
  s3Policy
);

backend.auth.resources.groups["team-beta"].role?.addToPrincipalPolicy(
  bedrockPolicy
);
backend.auth.resources.groups["team-beta"].role?.addToPrincipalPolicy(s3Policy);

backend.auth.resources.groups["team-gamma"].role?.addToPrincipalPolicy(
  bedrockPolicy
);
backend.auth.resources.groups["team-gamma"].role?.addToPrincipalPolicy(
  s3Policy
);

backend.auth.resources.groups["team-admin"].role?.addToPrincipalPolicy(
  bedrockPolicy
);
backend.auth.resources.groups["team-admin"].role?.addToPrincipalPolicy(
  s3Policy
);
