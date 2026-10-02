import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

fs.mkdirSync(".sites-runtime", { recursive: true });
const sql = new DatabaseSync(".sites-runtime/focus-local.sqlite");
sql.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");

for (const name of fs.readdirSync("drizzle").filter((file) => file.endsWith(".sql")).sort()) {
  if (!sql.prepare("SELECT name FROM local_migrations WHERE name=?").get(name)) {
    sql.exec(fs.readFileSync(`drizzle/${name}`, "utf8"));
    sql.prepare("INSERT INTO local_migrations(name) VALUES (?)").run(name);
  }
}

class Statement {
  constructor(text, args = []) {
    this.text = text;
    this.args = args;
  }

  bind(...args) {
    return new Statement(this.text, args);
  }

  async first() {
    return sql.prepare(this.text).get(...this.args) ?? null;
  }

  async all() {
    return { results: sql.prepare(this.text).all(...this.args) };
  }

  async run() {
    const result = sql.prepare(this.text).run(...this.args);
    return { meta: { changes: Number(result.changes) } };
  }
}

export const DB = {
  prepare(text) {
    return new Statement(text);
  },
  async batch(statements) {
    sql.exec("BEGIN");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      sql.exec("COMMIT");
      return results;
    } catch (error) {
      sql.exec("ROLLBACK");
      throw error;
    }
  },
};
