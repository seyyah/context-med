import datetime
import hashlib
import json
import os
import shutil
from typing import Any

import yaml

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


def compute_sha256(file_path: str) -> str:
    """Return the SHA-256 fingerprint for a local file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def read_document(file_path: str) -> str:
    """Read text content from supported local documents."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dosya bulunamadi: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        if fitz is None:
            raise ImportError("PyMuPDF (fitz) yuklu degil. PDF okunamiyor.")
        doc = fitz.open(file_path)
        return "".join(page.get_text() for page in doc)

    if ext in {".txt", ".md"}:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    raise ValueError(f"Desteklenmeyen dosya formati: {ext}")


def quality_control(text: str) -> dict[str, Any]:
    """Run deterministic baseline quality checks for ingestion."""
    word_count = len(text.split())
    approved = word_count > 50
    return {
        "word_count": word_count,
        "status": "approved" if approved else "rejected",
        "feedback": (
            "Icerik isleme icin yeterli uzunlukta."
            if approved
            else "Icerik cok kisa, islenemez."
        ),
        "risk_level": "middle-risk",
        "swot": {
            "strengths": "Metin analize uygun.",
            "weaknesses": "AI tabanli SWOT analizi henuz entegre degil.",
        },
    }


def generate_provenance(
    file_path: str,
    notebook: str,
    text_content: str,
    domain: str | None = None,
) -> dict[str, Any]:
    """Build the immutable provenance manifest for an ingested document."""
    return {
        "source_file": os.path.basename(file_path),
        "source_path": os.path.abspath(file_path),
        "notebook": notebook,
        "domain": domain,
        "ingested_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sha256_hash": compute_sha256(file_path),
        "metrics": {
            "word_count": len(text_content.split()),
            "quality_status": "middle-risk",
        },
    }


def build_gate_profile(
    input_path: str,
    notebook: str,
    text_content: str,
    qc_results: dict[str, Any],
    provenance_data: dict[str, Any],
    domain: str | None = None,
) -> dict[str, Any]:
    """Build the machine-readable gate profile returned by the CLI."""
    preview = " ".join(text_content.split())[:240]
    return {
        "input": {
            "path": os.path.abspath(input_path),
            "file_name": os.path.basename(input_path),
            "domain": domain,
            "notebook": notebook,
            "preview": preview,
        },
        "quality_control": qc_results,
        "provenance": provenance_data,
    }


def write_structured_output(output_path: str, payload: dict[str, Any], fmt: str) -> str:
    """Write a JSON or YAML payload to disk."""
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        if fmt == "yaml":
            yaml.safe_dump(payload, f, allow_unicode=True, sort_keys=False)
        else:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
    return output_path


def deliver_to_raw(original_path: str, provenance_data: dict[str, Any], package_root: str) -> tuple[str, str]:
    """Copy the source file and provenance manifest into context-gate/raw."""
    raw_dir = os.path.join(package_root, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    base_name = os.path.basename(original_path)
    safe_name = os.path.splitext(base_name)[0] + f"_{provenance_data['sha256_hash'][:8]}"
    ext = os.path.splitext(base_name)[1]

    dest_file = os.path.join(raw_dir, safe_name + ext)
    shutil.copy2(original_path, dest_file)

    dest_yaml = os.path.join(raw_dir, safe_name + "_provenance.yaml")
    with open(dest_yaml, "w", encoding="utf-8") as f:
        yaml.safe_dump(provenance_data, f, allow_unicode=True, sort_keys=False)

    return dest_file, dest_yaml


def lint_json_file(file_path: str) -> tuple[bool, dict[str, Any]]:
    """Validate that a JSON payload is parseable and has provenance data."""
    if not os.path.exists(file_path):
        return False, {"error": f"Dosya bulunamadi: {file_path}"}

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
    except json.JSONDecodeError as exc:
        return False, {
            "error": "Gecersiz JSON.",
            "line": exc.lineno,
            "column": exc.colno,
            "detail": exc.msg,
        }

    if not isinstance(payload, dict):
        return False, {"error": "JSON kok nesnesi obje olmalidir."}

    has_gate_provenance = isinstance(payload.get("provenance"), dict)
    has_manifest_fields = all(key in payload for key in ("source_file", "sha256_hash", "metrics"))
    if not (has_gate_provenance or has_manifest_fields):
        return False, {"error": "Provenance alani bulunamadi."}

    return True, {"status": "ok"}
