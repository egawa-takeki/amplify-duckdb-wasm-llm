import { validateSql, getSchemaDescription, LOG_SCHEMA } from "../sql-validator";

describe("sql-validator", () => {
  describe("validateSql", () => {
    it("SELECT文は有効", () => {
      const result = validateSql("SELECT * FROM logs WHERE level = 'ERROR'");
      expect(result.isValid).toBe(true);
      expect(result.sanitizedSql).toBeDefined();
    });

    it("WITH句から始まるクエリは有効", () => {
      const result = validateSql("WITH errors AS (SELECT * FROM logs WHERE level = 'ERROR') SELECT * FROM errors");
      expect(result.isValid).toBe(true);
    });

    it("空のSQLは無効", () => {
      const result = validateSql("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("空です");
    });

    it("空白のみのSQLは無効", () => {
      const result = validateSql("   ");
      expect(result.isValid).toBe(false);
    });

    it("COPY文は禁止", () => {
      const result = validateSql("COPY logs TO 'file.csv'");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("COPY");
    });

    it("CREATE TABLE文は禁止", () => {
      const result = validateSql("CREATE TABLE users (id INT)");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("CREATE TABLE");
    });

    it("DROP文は禁止", () => {
      const result = validateSql("DROP TABLE logs");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("DROP");
    });

    it("DELETE文は禁止", () => {
      const result = validateSql("DELETE FROM logs WHERE id = 1");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("DELETE");
    });

    it("UPDATE文は禁止", () => {
      const result = validateSql("UPDATE logs SET level = 'INFO'");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("UPDATE");
    });

    it("INSERT文は禁止", () => {
      const result = validateSql("INSERT INTO logs VALUES (1, 'test')");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("INSERT");
    });

    it("ATTACH文は禁止", () => {
      const result = validateSql("ATTACH 'database.db' AS db");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ATTACH");
    });

    it("DETACH文は禁止", () => {
      const result = validateSql("DETACH db");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("DETACH");
    });

    it("INSTALL文は禁止", () => {
      const result = validateSql("INSTALL httpfs");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("INSTALL");
    });

    it("LOAD文は禁止", () => {
      const result = validateSql("LOAD 'extension'");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("LOAD");
    });

    it("ALTER文は禁止", () => {
      const result = validateSql("ALTER TABLE logs ADD COLUMN new_col INT");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ALTER");
    });

    it("PRAGMA文は禁止", () => {
      const result = validateSql("PRAGMA version");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("PRAGMA");
    });

    it("SELECTで始まらないクエリは無効", () => {
      const result = validateSql("WHERE level = 'ERROR'");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("SELECTまたはWITH");
    });

    it("複数のセミコロンは無効", () => {
      const result = validateSql("SELECT * FROM logs; SELECT * FROM logs;");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("複数のSQL文");
    });

    it("SQLコメント（--）は無効", () => {
      const result = validateSql("SELECT * FROM logs -- comment");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("コメント");
    });

    it("SQLコメント（/* */）は無効", () => {
      const result = validateSql("SELECT * FROM logs /* comment */");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("コメント");
    });

    it("末尾のセミコロンは許可", () => {
      const result = validateSql("SELECT * FROM logs;");
      expect(result.isValid).toBe(true);
    });

    it("大文字小文字を区別しない", () => {
      const result1 = validateSql("select * from logs");
      expect(result1.isValid).toBe(true);

      const result2 = validateSql("SeLeCt * FrOm logs");
      expect(result2.isValid).toBe(true);
    });
  });

  describe("getSchemaDescription", () => {
    it("スキーマ説明を返す", () => {
      const description = getSchemaDescription();
      expect(description).toContain("テーブル名:");
      expect(description).toContain(LOG_SCHEMA.tableName);
      expect(description).toContain("timestamp");
      expect(description).toContain("level");
      expect(description).toContain("message");
    });

    it("全てのカラムが含まれる", () => {
      const description = getSchemaDescription();
      LOG_SCHEMA.columns.forEach((col) => {
        expect(description).toContain(col.name);
        expect(description).toContain(col.type);
        expect(description).toContain(col.description);
      });
    });
  });
});
