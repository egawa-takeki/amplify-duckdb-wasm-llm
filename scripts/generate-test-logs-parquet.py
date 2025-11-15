#!/usr/bin/env python3
"""
テスト用ログファイル生成スクリプト（Parquet形式・ソーシャルゲーム向け）

Parquet形式でログを生成します。
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# ログスキーマ (ソーシャルゲーム向け)
LOG_SCHEMA = {
    # 基本情報
    "timestamp": "TIMESTAMP",
    "team_id": "VARCHAR",
    "event_type": "VARCHAR",
    "level": "VARCHAR",

    # プレイヤー情報
    "player_id": "VARCHAR",
    "player_level": "INTEGER",
    "session_id": "VARCHAR",

    # ゲームイベント情報
    "event_name": "VARCHAR",
    "event_data": "TEXT",

    # アイテム/リソース
    "item_id": "VARCHAR",
    "item_quantity": "INTEGER",
    "currency_type": "VARCHAR",
    "currency_amount": "INTEGER",

    # 課金情報
    "transaction_id": "VARCHAR",
    "purchase_amount": "DECIMAL",
    "currency_code": "VARCHAR",

    # パフォーマンス
    "duration_ms": "INTEGER",
    "status_code": "INTEGER",

    # エラー/デバッグ
    "error": "TEXT",
    "trace_id": "VARCHAR",

    # その他
    "platform": "VARCHAR",
    "app_version": "VARCHAR",
    "device_id": "VARCHAR",
}

# サンプルデータ
LOG_LEVELS = ["INFO", "WARN", "ERROR", "DEBUG"]
EVENT_TYPES = ["login", "logout", "gacha", "purchase", "quest", "battle", "item", "currency", "social", "system"]
PLATFORMS = ["iOS", "Android", "Web"]
APP_VERSIONS = ["1.0.0", "1.0.1", "1.1.0", "1.2.0", "2.0.0"]

# ゲームイベント定義
GAME_EVENTS = {
    "login": ["daily_login", "first_login", "return_login", "consecutive_login"],
    "logout": ["normal_logout", "timeout_logout", "force_logout"],
    "gacha": ["normal_gacha", "rare_gacha", "premium_gacha", "free_gacha"],
    "purchase": ["gem_purchase", "pack_purchase", "subscription_purchase"],
    "quest": ["quest_start", "quest_clear", "quest_fail", "quest_abandon"],
    "battle": ["battle_start", "battle_win", "battle_lose", "battle_escape"],
    "item": ["item_obtain", "item_use", "item_sell", "item_upgrade"],
    "currency": ["currency_earn", "currency_spend", "currency_gift"],
    "social": ["friend_add", "friend_remove", "guild_join", "guild_leave", "chat_send"],
    "system": ["tutorial_complete", "level_up", "achievement_unlock", "maintenance_start"],
}

# アイテムID
ITEM_IDS = [
    "item_sword_001", "item_shield_002", "item_potion_003", "item_scroll_004",
    "item_gem_005", "item_ticket_006", "char_hero_001", "char_villain_002"
]

# 通貨タイプ
CURRENCY_TYPES = ["gem", "coin", "ticket", "energy", "exp"]

# 課金通貨
CURRENCY_CODES = ["JPY", "USD", "EUR"]

# エラーメッセージ
ERRORS = [
    None, None, None, None, None, None, None, None,  # ほとんどのログはエラーなし
    "NetworkError: Connection timeout",
    "GameError: Insufficient currency",
    "ValidationError: Invalid item ID",
    "AuthError: Session expired",
    "ServerError: Database connection failed",
]

# Team Alpha (RPG) 固有データ
RPG_CHARACTER_CLASSES = ["warrior", "mage", "archer", "priest", "rogue", "paladin"]
RPG_QUEST_IDS = [f"quest_rpg_{i:03d}" for i in range(1, 101)]
RPG_DUNGEON_IDS = [f"dungeon_{i:02d}" for i in range(1, 21)]
RPG_BOSS_IDS = [f"boss_{i:02d}" for i in range(1, 16)]

# Team Beta (Puzzle) 固有データ
PUZZLE_STAGE_IDS = [f"stage_{i:03d}" for i in range(1, 201)]
PUZZLE_TYPES = ["match3", "slide", "rotate", "swap", "merge"]

# Team Gamma (Card) 固有データ
CARD_DECK_IDS = [f"deck_{i:03d}" for i in range(1, 51)]
CARD_IDS = [f"card_{i:04d}" for i in range(1, 501)]
CARD_RARITIES = ["common", "rare", "epic", "legendary"]
CARD_BATTLE_IDS = [f"battle_{i:06d}" for i in range(100000, 200000)]

def generate_event_data(event_type: str, event_name: str) -> dict:
    """イベントタイプに応じた詳細データを生成"""
    if event_type == "gacha":
        return {
            "gacha_type": event_name,
            "rarity": random.choice(["common", "rare", "super_rare", "ultra_rare"]),
            "cost": random.randint(100, 1000),
        }
    elif event_type == "battle":
        return {
            "enemy_id": f"enemy_{random.randint(1, 100):03d}",
            "stage_id": f"stage_{random.randint(1, 50):02d}",
            "result": event_name.split("_")[1] if "_" in event_name else "unknown",
        }
    elif event_type == "quest":
        return {
            "quest_id": f"quest_{random.randint(1, 200):03d}",
            "difficulty": random.choice(["easy", "normal", "hard", "extreme"]),
        }
    elif event_type == "purchase":
        return {
            "product_id": f"prod_{random.randint(1, 50):03d}",
            "payment_method": random.choice(["credit_card", "app_store", "google_play"]),
        }
    return {}

def generate_team_specific_fields(team_id: str, event_type: str) -> dict:
    """チーム固有のフィールドを生成"""
    fields = {}

    if team_id == "team-alpha":
        # Team Alpha: RPG固有フィールド
        fields["character_class"] = random.choice(RPG_CHARACTER_CLASSES)
        if event_type == "quest":
            fields["quest_id"] = random.choice(RPG_QUEST_IDS)
            if random.random() > 0.7:
                fields["dungeon_id"] = random.choice(RPG_DUNGEON_IDS)
        elif event_type == "battle":
            fields["quest_id"] = random.choice(RPG_QUEST_IDS)
            fields["dungeon_id"] = random.choice(RPG_DUNGEON_IDS)
            if random.random() > 0.6:
                fields["boss_id"] = random.choice(RPG_BOSS_IDS)
        else:
            fields["quest_id"] = None
            fields["dungeon_id"] = None
            fields["boss_id"] = None

    elif team_id == "team-beta":
        # Team Beta: Puzzle固有フィールド
        fields["stage_id"] = random.choice(PUZZLE_STAGE_IDS)
        fields["puzzle_type"] = random.choice(PUZZLE_TYPES)
        if event_type in ["quest", "battle"]:
            fields["moves_count"] = random.randint(10, 100)
            fields["score"] = random.randint(1000, 100000)
            fields["combo_max"] = random.randint(2, 50)
        else:
            fields["moves_count"] = None
            fields["score"] = None
            fields["combo_max"] = None

    elif team_id == "team-gamma":
        # Team Gamma: Card固有フィールド
        fields["deck_id"] = random.choice(CARD_DECK_IDS)
        fields["card_id"] = random.choice(CARD_IDS)
        fields["rarity"] = random.choice(CARD_RARITIES)
        if event_type == "battle":
            fields["battle_id"] = random.choice(CARD_BATTLE_IDS)
            fields["turn_count"] = random.randint(1, 30)
        elif event_type == "gacha":
            fields["battle_id"] = None
            fields["turn_count"] = None
        else:
            fields["battle_id"] = None
            fields["turn_count"] = None

    return fields

def generate_log_entry(timestamp: datetime, team_id: str, player_pool: list) -> dict:
    """単一のログエントリを生成"""
    event_type = random.choice(EVENT_TYPES)
    event_name = random.choice(GAME_EVENTS[event_type])
    error = random.choice(ERRORS)
    level = "ERROR" if error else random.choice(["INFO", "INFO", "INFO", "INFO", "DEBUG", "WARN"])

    # プレイヤープールから選択（重複させる）
    player_id = random.choice(player_pool)
    platform = random.choice(PLATFORMS)

    # イベントデータ
    event_data = generate_event_data(event_type, event_name)

    log_entry = {
        # 基本情報
        "timestamp": timestamp.isoformat(),
        "team_id": team_id,
        "event_type": event_type,
        "level": level,

        # プレイヤー情報
        "player_id": player_id,
        "player_level": random.randint(1, 100),
        "session_id": f"session_{random.randint(1000000, 9999999)}",

        # ゲームイベント情報
        "event_name": event_name,
        "event_data": json.dumps(event_data) if event_data else None,

        # アイテム/リソース (ランダムに設定)
        "item_id": random.choice(ITEM_IDS) if random.random() > 0.5 else None,
        "item_quantity": random.randint(1, 99) if random.random() > 0.5 else None,
        "currency_type": random.choice(CURRENCY_TYPES) if random.random() > 0.3 else None,
        "currency_amount": random.randint(10, 10000) if random.random() > 0.3 else None,

        # 課金情報 (purchaseイベントの場合のみ)
        "transaction_id": f"txn_{random.randint(100000000, 999999999)}" if event_type == "purchase" else None,
        "purchase_amount": round(random.uniform(1.99, 99.99), 2) if event_type == "purchase" else None,
        "currency_code": random.choice(CURRENCY_CODES) if event_type == "purchase" else None,

        # パフォーマンス
        "duration_ms": random.randint(10, 5000),
        "status_code": 500 if error else random.choice([200, 200, 200, 200, 201, 204]),

        # エラー/デバッグ
        "error": error,
        "trace_id": f"trace_{random.randint(100000000, 999999999)}",

        # その他
        "platform": platform,
        "app_version": random.choice(APP_VERSIONS),
        "device_id": f"device_{platform.lower()}_{random.randint(10000, 99999)}",
    }

    # チーム固有フィールドを追加
    team_specific = generate_team_specific_fields(team_id, event_type)
    log_entry.update(team_specific)

    return log_entry

def generate_logs_for_hour(date: datetime, hour: int, team_id: str, player_pool: list, num_logs: int = 50) -> list:
    """指定時間のログを生成"""
    logs = []

    # その時間帯の開始時刻
    hour_start = date.replace(hour=hour, minute=0, second=0, microsecond=0)

    for i in range(num_logs):
        # その時間内のランダムな時刻を生成
        random_seconds = random.randint(0, 3599)  # 1時間 = 3600秒
        log_time = hour_start + timedelta(seconds=random_seconds)

        log_entry = generate_log_entry(log_time, team_id, player_pool)
        logs.append(log_entry)

    # 時系列でソート
    logs.sort(key=lambda x: x["timestamp"])

    return logs

def save_logs_to_parquet(logs: list, output_path: Path):
    """ログをParquet形式で保存"""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # DataFrameに変換
    df = pd.DataFrame(logs)

    # timestampをdatetime型に変換
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Parquetファイルとして保存（Snappy圧縮、dictionary encodingを無効化）
    df.to_parquet(
        output_path,
        engine='pyarrow',
        compression='snappy',
        index=False,
        use_dictionary=False  # 辞書エンコーディングを無効化して型の一貫性を保つ
    )

    print(f"Generated: {output_path} ({len(logs)} logs)")

def main():
    """メイン処理"""
    # 出力ディレクトリ
    output_dir = Path(__file__).parent.parent / "test-data" / "logs-parquet"

    # 各チームのログを生成 (document.mdのパーティション構造に準拠)
    teams = {
        "team-alpha": "team-alpha",
        "team-beta": "team-beta",
        "team-gamma": "team-gamma"
    }

    # 2025年11月12日から12月1日までのログを生成（20日間）
    start_date = datetime(2025, 11, 12, 0, 0, 0)
    num_days = 20  # 11/12 から 12/1 まで

    total_files = 0
    for team_name, team_id in teams.items():
        # チームごとにプレイヤーIDプールを作成（重複させるため）
        # 各チームに100～150人のユニークなプレイヤー
        num_players = random.randint(100, 150)
        player_pool = [f"player_{team_id}_{i:05d}" for i in range(1, num_players + 1)]

        for days_offset in range(num_days):
            date = start_date + timedelta(days=days_offset)

            # document.mdに準拠したパーティション構造
            year = date.strftime("%Y")
            month = date.strftime("%m")
            day = date.strftime("%d")

            # 11/15～11/20はデータ量を増やす（1時間あたり200件）
            date_str = date.strftime("%Y-%m-%d")
            if "2025-11-15" <= date_str <= "2025-11-20":
                logs_per_hour = 200
            else:
                logs_per_hour = 50

            # 24時間分のログを生成
            for hour in range(24):
                logs = generate_logs_for_hour(date, hour, team_id, player_pool, num_logs=logs_per_hour)

                # パーティション構造: team_id=xxx/year=YYYY/month=MM/day=DD/hour=HH/
                output_path = (output_dir / f"team_id={team_id}" /
                              f"year={year}" / f"month={month}" / f"day={day}" /
                              f"hour={hour:02d}" /
                              f"logs-{hour:02d}.parquet")
                save_logs_to_parquet(logs, output_path)
                total_files += 1

    print(f"\nTotal: {total_files} files generated in {output_dir}")
    print(f"  {len(teams)} teams × {num_days} days × 24 hours = {len(teams) * num_days * 24} files")
    print(f"  Date range: 2025-11-12 to 2025-12-01")
    print("\nData Volume:")
    print("  2025-11-12 to 2025-11-14: 50 logs/hour (normal)")
    print("  2025-11-15 to 2025-11-20: 200 logs/hour (HIGH VOLUME)")
    print("  2025-11-21 to 2025-12-01: 50 logs/hour (normal)")
    print("\nPlayer IDs:")
    print("  Each team has 100-150 unique players")
    print("  Player IDs are reused across multiple events")
    print("  Format: player_team-id_00001 to player_team-id_00150")
    print("\nFormat: Parquet (Snappy compression)")
    print("Partition structure:")
    print("  team_id=team-alpha/year=YYYY/month=MM/day=DD/hour=HH/logs-HH.parquet")
    print("\nParquet Benefits:")
    print("  - 70-90% smaller than JSONL.GZ")
    print("  - Columnar format for fast queries")
    print("  - Built-in compression (Snappy)")
    print("  - Schema preservation")
    print("  - Optimized for DuckDB WASM")
    print("\nTeam-Specific Schemas:")
    print("  Team Alpha (RPG):")
    print("    - character_class: warrior, mage, archer, priest, rogue, paladin")
    print("    - quest_id: quest_rpg_001 ~ quest_rpg_100")
    print("    - dungeon_id: dungeon_01 ~ dungeon_20")
    print("    - boss_id: boss_01 ~ boss_15")
    print("  Team Beta (Puzzle):")
    print("    - stage_id: stage_001 ~ stage_200")
    print("    - moves_count: 10 ~ 100")
    print("    - score: 1000 ~ 100000")
    print("    - combo_max: 2 ~ 50")
    print("    - puzzle_type: match3, slide, rotate, swap, merge")
    print("  Team Gamma (Card):")
    print("    - deck_id: deck_001 ~ deck_050")
    print("    - card_id: card_0001 ~ card_0500")
    print("    - rarity: common, rare, epic, legendary")
    print("    - battle_id: battle_100000 ~ battle_200000")
    print("    - turn_count: 1 ~ 30")
    print("\nCommon Fields (All Teams):")
    print("  - Event types: login, gacha, purchase, quest, battle, item, currency, social, system")
    print("  - Player data: player_id, player_level, session_id")
    print("  - Platform: iOS, Android, Web")
    print("\nNext steps:")
    print("1. Install dependencies: pip install pyarrow pandas")
    print("2. Get S3 bucket name from amplify_outputs.json")
    print("3. Upload logs using: aws s3 sync test-data/logs-parquet/ s3://your-bucket/")

if __name__ == "__main__":
    main()
