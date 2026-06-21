#!/usr/bin/env python3
"""
File Organiser — Sort school files by type, subject, or date.
Usage:
  python3 scripts/file-organiser.py [folder] [--mode type|subject|date]
  python3 scripts/file-organiser.py [folder] --dry-run
  python3 scripts/file-organiser.py --undo
"""

import os, sys, shutil, json, argparse, time
from pathlib import Path

STATE_DIR = Path.home() / ".openclaw" / "workspace" / "state"
CONFIG_DIR = Path.home() / ".config" / "file-organiser"
LAST_FOLDER = STATE_DIR / "file-organiser-last-folder.txt"
MANIFEST = STATE_DIR / "file-organiser-manifest.json"
RULES_FILE = CONFIG_DIR / "rules.json"

# Default type categories
TYPE_MAP = {
    "Documents":  [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf", ".odt", ".tex"],
    "Images":     [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico"],
    "Audio":      [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"],
    "Video":      [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"],
    "Archives":   [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"],
    "Code":       [".py", ".js", ".html", ".css", ".cpp", ".c", ".h", ".java", ".go", ".rs", ".ts", ".sh", ".json", ".yaml", ".xml"],
    "Spreadsheets":[".xlsx", ".xls", ".csv", ".numbers"],
    "Presentations":[".pptx", ".ppt", ".key"],
}

DEFAULT_SUBJECT_RULES = {
    "Math":       ["math", "algebra", "calculus", "geometry", "trig", "statistics", "probability", "add math"],
    "Science":    ["physics", "chemistry", "biology", "science", "lab", "experiment"],
    "English":    ["english", "essay", "literature", "grammar", "writing", "comprehension"],
    "Humanities": ["history", "geography", "geog", "social", "economics"],
    "Languages":  ["chinese", "mandarin", "malay", "tamil", "language"],
}

def load_rules():
    rules = {"subject_keywords": {}, "custom_extensions": {}}
    if RULES_FILE.exists():
        try:
            with open(RULES_FILE) as f:
                rules = json.load(f)
        except:
            pass
    # Merge defaults
    for k, v in DEFAULT_SUBJECT_RULES.items():
        if k not in rules.get("subject_keywords", {}):
            rules.setdefault("subject_keywords", {})[k] = v
    for k, v in TYPE_MAP.items():
        if k not in rules.get("custom_extensions", {}):
            rules.setdefault("custom_extensions", {})[k] = v
    return rules

def classify_by_type(ext, rules):
    ext = ext.lower()
    for cat, exts in rules["custom_extensions"].items():
        if ext in exts:
            return cat
    return "Others"

def classify_by_subject(name, rules):
    name_lower = name.lower()
    for subject, keywords in rules["subject_keywords"].items():
        for kw in keywords:
            if kw in name_lower:
                return subject
    return "Uncategorised"

def classify_by_date(mtime):
    return time.strftime("%Y-%m", time.localtime(mtime))

def get_files(folder):
    """List files in folder, skip dirs and hidden."""
    for entry in sorted(Path(folder).iterdir(), key=lambda p: p.name):
        if entry.is_file() and not entry.name.startswith("."):
            yield entry

def organise(folder, mode, dry_run, do_copy):
    folder = Path(folder).expanduser().resolve()
    if not folder.is_dir():
        print(f"✗ Folder not found: {folder}")
        sys.exit(1)

    rules = load_rules()
    files = list(get_files(folder))
    if not files:
        print(f"📂 No files to organise in {folder}")
        return

    results = {}  # dest -> [filenames]
    errors = []

    for f in files:
        try:
            if mode == "type":
                sub = classify_by_type(f.suffix, rules)
            elif mode == "subject":
                sub = classify_by_subject(f.stem, rules)
            elif mode == "date":
                sub = classify_by_date(f.stat().st_mtime)
            else:
                sub = "Others"

            dest = folder / sub
            dest.mkdir(exist_ok=True)
            target = dest / f.name

            # Handle name collision
            counter = 1
            while target.exists():
                stem = f.stem
                target = dest / f"{stem}_{counter}{f.suffix}"
                counter += 1

            results.setdefault(str(dest), []).append(f.name)

            if not dry_run:
                if do_copy:
                    shutil.copy2(str(f), str(target))
                else:
                    shutil.move(str(f), str(target))
        except Exception as e:
            errors.append(f"{f.name}: {e}")

    # Report
    print(f"\n📁 {folder} sorted by {mode}:")
    total_size = 0
    total_files = 0
    for dest_path, names in sorted(results.items()):
        size = 0
        for n in names:
            p = Path(dest_path, n)
            if p.exists():
                size += p.stat().st_size
            else:
                # dry-run: estimate from source
                src = folder / n
                if src.exists():
                    size += src.stat().st_size
        total_size += size
        total_files += len(names)
        sub_name = Path(dest_path).name
        print(f"  {sub_name}/ → {len(names)} files ({size/1024:.1f} KB)")

    print(f"\n📦 {len(results)} folders created. {total_files} files organised ({total_size/1024:.1f} KB). {'(dry run)' if dry_run else ''}")
    if errors:
        print(f"\n⚠️  {len(errors)} errors:")
        for e in errors:
            print(f"  ✗ {e}")

    # Save manifest for undo
    if not dry_run:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        manifest = {
            "timestamp": time.time(),
            "folder": str(folder),
            "mode": mode,
            "moves": {str(folder / k): v for k, v in results.items()}
        }
        with open(MANIFEST, "w") as f:
            json.dump(manifest, f, indent=2)
        with open(LAST_FOLDER, "w") as f:
            f.write(str(folder))

def undo():
    if not MANIFEST.exists():
        print("✗ No previous sort to undo.")
        return
    with open(MANIFEST) as f:
        manifest = json.load(f)

    folder = Path(manifest["folder"])
    restored = 0
    for dest_dir in sorted(folder.iterdir()):
        if not dest_dir.is_dir():
            continue
        for f in dest_dir.iterdir():
            if f.is_file():
                target = folder / f.name
                counter = 1
                while target.exists():
                    target = folder / f"{f.stem}_{counter}{f.suffix}"
                    counter += 1
                shutil.move(str(f), str(target))
                restored += 1
        # Remove empty dirs
        try:
            dest_dir.rmdir()
        except:
            pass

    print(f"↩️  Restored {restored} files to {folder}")
    MANIFEST.unlink(missing_ok=True)

def main():
    parser = argparse.ArgumentParser(description="Sort files in a folder")
    parser.add_argument("folder", nargs="?", help="Folder to organise (default: last used or ~/Downloads)")
    parser.add_argument("--mode", choices=["type", "subject", "date"], default="type", help="Organisation mode")
    parser.add_argument("--dry-run", action="store_true", help="Preview without moving files")
    parser.add_argument("--copy", action="store_true", help="Copy instead of move")
    parser.add_argument("--undo", action="store_true", help="Undo last organise")
    args = parser.parse_args()

    if args.undo:
        undo()
        return

    folder = args.folder
    if not folder and LAST_FOLDER.exists():
        folder = LAST_FOLDER.read_text().strip()
    folder = folder or str(Path.home() / "Downloads")

    organise(folder, args.mode, args.dry_run, args.copy)

if __name__ == "__main__":
    main()
