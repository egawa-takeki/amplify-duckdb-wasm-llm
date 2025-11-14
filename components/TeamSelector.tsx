"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/Card";
import { getUserInfo } from "@/lib/auth";
import { getTeamSchema } from "@/lib/team-schemas";

interface TeamSelectorProps {
  onTeamSelect: (teamId: string) => void;
  currentTeamId?: string;
}

/**
 * チーム選択コンポーネント
 *
 * ユーザーがアクセス可能なチームから選択できる
 */
export function TeamSelector({ onTeamSelect, currentTeamId }: TeamSelectorProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(
    currentTeamId || ""
  );
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ユーザーがアクセス可能なチームを取得
    getUserInfo().then((userInfo) => {
      if (userInfo) {
        setAvailableTeams(userInfo.availableTeams);

        // 選択されているチームがない場合、最初のチームを選択
        if (!selectedTeam && userInfo.availableTeams.length > 0) {
          const savedTeamId = localStorage.getItem("selectedTeamId");
          const initialTeam = savedTeamId && userInfo.availableTeams.includes(savedTeamId)
            ? savedTeamId
            : userInfo.availableTeams[0];

          setSelectedTeam(initialTeam);
          onTeamSelect(initialTeam);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    onTeamSelect(teamId);
    // ローカルストレージに保存
    localStorage.setItem("selectedTeamId", teamId);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <div className="text-center text-gray-600">読み込み中...</div>
      </Card>
    );
  }

  if (availableTeams.length === 0) {
    return (
      <Card className="mb-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800 mb-1">
              アクセス可能なチームがありません
            </p>
            <p className="text-sm text-yellow-700">
              管理者にCognitoグループへの追加を依頼してください。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            チーム選択
          </h3>
          <p className="text-sm text-gray-600">
            ログを表示するチームを選択してください ({availableTeams.length}チーム)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">チームを選択...</option>
            {availableTeams.map((teamId) => {
              const teamSchema = getTeamSchema(teamId);
              return (
                <option key={teamId} value={teamId}>
                  {teamSchema.teamName} ({teamSchema.gameType})
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </Card>
  );
}
