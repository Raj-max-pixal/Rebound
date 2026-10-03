import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve migrations from the source tree in development and the Electron
// resources directory when running from a packaged executable.
const migrationCandidates = [
  path.join(__dirname, "../drizzle"),
  path.join(process.resourcesPath || "", "app.asar", "drizzle"),
  path.join(process.resourcesPath || "", "drizzle"),
];
const drizzleDir = migrationCandidates.find((candidate) => fs.existsSync(candidate));
if (!drizzleDir) throw new Error("Rebound migrations are missing from the packaged application.");

const runtimeDir = process.env.APPDATA
  ? path.join(process.env.APPDATA, "Rebound")
  : path.join(__dirname, "../.sites-runtime");

fs.mkdirSync(runtimeDir, { recursive: true });
const sql = new DatabaseSync(path.join(runtimeDir, "focus-local.sqlite"));
sql.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");

for (const name of fs.readdirSync(drizzleDir).filter((file) => file.endsWith(".sql")).sort()) {
  if (!sql.prepare("SELECT name FROM local_migrations WHERE name=?").get(name)) {
    sql.exec(fs.readFileSync(path.join(drizzleDir, name), "utf8"));
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
