# File Organiser Skill

Sort files in a messy folder into clean subdirectories by type, subject, or date.

## Trigger

"organise my files", "sort this folder", "clean up my downloads", "file organiser"

## Usage

```bash
python3 scripts/file-organiser.py [folder] [--mode type|subject|date] [--dry-run] [--copy] [--undo]
```

### Modes

| Mode | Behaviour |
|---|---|
| `type` (default) | Subfolders: Documents, Images, Audio, Video, Archives, Code, Spreadsheets, Others |
| `subject` | Subfolders: Math, Science, English, Humanities, Languages + custom rules |
| `date` | Subfolders by YYYY-MM based on file modification time |

### Safety

- `--dry-run` to preview without moving anything
- `--undo` to reverse the last organise

## Implementation

Script: `scripts/file-organiser.py` — pure Python 3, no external dependencies.
