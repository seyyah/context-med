import json
import os
import sys
from importlib.metadata import PackageNotFoundError, version
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from context_gate import __version__
from context_gate.core import (
    build_gate_profile,
    deliver_to_raw,
    generate_provenance,
    lint_json_file,
    quality_control,
    read_document,
    write_structured_output,
)

app = typer.Typer(
    help="Context-Med Gate: input quality control, provenance, and ingestion.",
    no_args_is_help=True,
    add_completion=False,
)
console = Console()


def _resolve_version() -> str:
    try:
        return version("context-med-gate")
    except PackageNotFoundError:
        return __version__


def _version_callback(value: bool) -> None:
    if value:
        console.print(_resolve_version())
        raise typer.Exit()


def _emit_payload(payload: dict, fmt: str) -> None:
    if fmt == "yaml":
        import yaml

        console.print(yaml.safe_dump(payload, allow_unicode=True, sort_keys=False).strip())
        return
    console.print_json(json.dumps(payload, ensure_ascii=False, indent=2))


def _resolve_approval(decision: Optional[str], dry_run: bool) -> str:
    if dry_run:
        return "approve"
    if decision:
        return decision.strip().lower()
    if not sys.stdin.isatty():
        return "approve"
    return typer.prompt(
        "Seciminiz [approve/reject/redact]",
        default="approve",
    ).strip().lower()


@app.callback()
def main(
    version: bool = typer.Option(
        False,
        "--version",
        "-V",
        callback=_version_callback,
        is_eager=True,
        help="Show semantic version and exit.",
    ),
) -> None:
    """Root command for the context-gate CLI."""


@app.command()
def status(
    format: str = typer.Option("text", "--format", "-f", help="Output format: text | json"),
) -> None:
    """Show module status."""
    payload = {
        "module": "context-gate",
        "status": "ready",
        "version": _resolve_version(),
        "supports": ["status", "ingest", "lint"],
    }
    if format == "json":
        _emit_payload(payload, "json")
        return
    console.print("[green]context-gate is active and ready.[/green]")


@app.command()
def ingest(
    input: str = typer.Option(..., "--input", "-i", help="Input file path."),
    output: str = typer.Option(..., "--output", "-o", help="Output profile path."),
    notebook: str = typer.Option("default-notebook", "--notebook", "-n", help="Notebook name."),
    domain: Optional[str] = typer.Option(None, "--domain", help="Domain label."),
    format: str = typer.Option("json", "--format", "-f", help="Output format: json | yaml"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Simulate without writing files."),
    decision: Optional[str] = typer.Option(
        None,
        "--decision",
        help="Approval override: approve | reject | redact.",
    ),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed logs."),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Only emit errors."),
) -> None:
    """Ingest a document, verify quality, and emit provenance artifacts."""
    if format not in {"json", "yaml"}:
        console.print("[bold red]Desteklenmeyen format. json veya yaml kullanin.[/bold red]")
        raise typer.Exit(code=1)

    if not quiet:
        console.print(f"[bold blue]Ingestion baslatiliyor:[/bold blue] {input}")

    try:
        text_content = read_document(input)
    except Exception as exc:
        console.print(f"[bold red]Dosya okuma hatasi:[/bold red] {exc}")
        raise typer.Exit(code=1)

    qc_results = quality_control(text_content)
    if qc_results["status"] != "approved":
        console.print("[bold red]Kalite kontrol basarisiz. Belge ingest icin uygun degil.[/bold red]")
        raise typer.Exit(code=2)

    if verbose and not quiet:
        console.print(
            Panel.fit(
                f"Kelime sayisi: {qc_results['word_count']}\n"
                f"Geri bildirim: {qc_results['feedback']}\n"
                f"Risk seviyesi: {qc_results['risk_level']}",
                title="Kalite Kontrol Ozeti",
                border_style="yellow",
            )
        )

    approval = _resolve_approval(decision, dry_run)
    if approval == "reject":
        console.print("[bold red]Islem kullanici karariyla reddedildi.[/bold red]")
        raise typer.Exit(code=1)
    if approval == "redact":
        console.print("[bold yellow]Redaksiyon modu henuz aktif degil.[/bold yellow]")
        raise typer.Exit(code=1)
    if approval not in {"approve", "approved"}:
        console.print("[bold red]Gecersiz karar. approve, reject veya redact kullanin.[/bold red]")
        raise typer.Exit(code=1)

    provenance = generate_provenance(input, notebook, text_content, domain=domain)
    gate_profile = build_gate_profile(
        input_path=input,
        notebook=notebook,
        text_content=text_content,
        qc_results=qc_results,
        provenance_data=provenance,
        domain=domain,
    )

    if dry_run:
        if not quiet:
            console.print("[cyan]Dry-run tamamlandi. Dosya yazilmadi.[/cyan]")
        raise typer.Exit(code=0)

    write_structured_output(output, gate_profile, format)
    package_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    raw_file, provenance_file = deliver_to_raw(input, provenance, package_root)

    if quiet:
        raise typer.Exit(code=0)

    table = Table(show_header=False, box=None)
    table.add_row("Profil", output)
    table.add_row("Raw belge", raw_file)
    table.add_row("Manifest", provenance_file)

    console.print("[bold green]Ingestion basarili.[/bold green]")
    console.print(table)


@app.command()
def lint(
    input: str = typer.Option(..., "--input", "-i", help="JSON file to validate."),
    format: str = typer.Option("text", "--format", "-f", help="Output format: text | json"),
) -> None:
    """Validate that a JSON artifact contains provenance metadata."""
    ok, details = lint_json_file(input)
    payload = {
        "input": os.path.abspath(input),
        "valid": ok,
        "details": details,
    }

    if format == "json":
        _emit_payload(payload, "json")
    else:
        if ok:
            console.print("[green]Lint passed.[/green]")
        else:
            console.print(f"[bold red]Lint failed:[/bold red] {details['error']}")

    raise typer.Exit(code=0 if ok else 2)


if __name__ == "__main__":
    app()
