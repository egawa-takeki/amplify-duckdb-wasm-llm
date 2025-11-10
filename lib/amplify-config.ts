import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

/**
 * Amplify設定
 *
 * amplify_outputs.jsonから設定を読み込み、一度だけAmplifyを設定する
 */

let isConfigured = false;

export function configureAmplify() {
  if (typeof window !== "undefined" && !isConfigured) {
    Amplify.configure(outputs, {
      ssr: false,
    });
    isConfigured = true;
  }
}
