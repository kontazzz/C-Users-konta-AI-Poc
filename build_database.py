from pathlib import Path
import sqlite3


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "dog_food_jp.sqlite"


def run_sql_file(conn: sqlite3.Connection, path: Path) -> None:
    conn.executescript(path.read_text(encoding="utf-8"))


def main() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        run_sql_file(conn, BASE_DIR / "schema.sql")
        run_sql_file(conn, BASE_DIR / "seed_reference.sql")
        conn.commit()

        product_count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        source_count = conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0]
        print(f"created={DB_PATH}")
        print(f"products={product_count}")
        print(f"sources={source_count}")


if __name__ == "__main__":
    main()
