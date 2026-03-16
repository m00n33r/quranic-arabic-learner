#!/usr/bin/env python3
"""
Seed скрипт для заполнения БД данными 30-го джуза.

Использование:
    python scripts/seed_db.py           # загрузить (пропустить если уже есть)
    python scripts/seed_db.py --force   # перезагрузить всё
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import argparse
from app.core.database import SessionLocal
from app.data.seeder import DatabaseSeeder


def main():
    parser = argparse.ArgumentParser(description="Seed Quran database")
    parser.add_argument("--force", action="store_true", help="Clear existing data before seeding")
    parser.add_argument("--juz", type=int, default=30, help="Juz number (default: 30)")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seeder = DatabaseSeeder(db)
        stats = seeder.seed(juz_number=args.juz, force=args.force)
        print(f"\nРезультат: {stats}")
    except Exception as e:
        print(f"Ошибка: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
