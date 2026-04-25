import { FileBadge2, FileUp, Orbit, ShieldEllipsis } from 'lucide-react';
import { acceptedFormats, recommendedDomains } from 'context-med-gate';
import type { ChangeEvent, DragEvent } from 'react';
import { StageShell } from './StageShell';

type UploadStageProps = {
  domain: string;
  notebook: string;
  onDomainChange: (value: string) => void;
  onNotebookChange: (value: string) => void;
  onFileSelect: (file: File) => void;
};

export function UploadStage({
  domain,
  notebook,
  onDomainChange,
  onNotebookChange,
  onFileSelect,
}: UploadStageProps) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      event.target.value = '';
    }
  };

  return (
    <StageShell
      eyebrow="Upload state"
      title="Editorial intake for high-stakes clinical context"
      description="Import a source document, assign its domain, and prepare a verifiable gate profile before it lands in raw delivery."
      side={
        <>
          <div className="panel panel-subtle stack-sm">
            <div className="side-header">
              <ShieldEllipsis size={18} />
              <strong>Provenance protocol</strong>
            </div>
            <p>
              Every upload receives a structured profile, SHA-256 fingerprint, notebook association,
              and delivery receipt that mirrors the CLI contract.
            </p>
          </div>
          <div className="panel panel-subtle stack-sm">
            <div className="side-header">
              <Orbit size={18} />
              <strong>Accepted formats</strong>
            </div>
            <div className="chip-row">
              {acceptedFormats.map((format) => (
                <span key={format} className="chip">
                  {format}
                </span>
              ))}
            </div>
          </div>
        </>
      }
    >
      <div className="upload-grid">
        <label
          className="dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            className="sr-only"
            type="file"
            accept=".pdf,.txt,.md,.json"
            onChange={handleChange}
          />
          <div className="dropzone-orb">
            <FileUp size={30} />
          </div>
          <h2>Drop a document or browse locally</h2>
          <p>
            The demo computes a real browser-side hash through the exported package adapter, then
            stages the record for human review.
          </p>
          <span className="button button-primary">Choose file</span>
        </label>

        <div className="panel panel-subtle stack-md">
          <div className="side-header">
            <FileBadge2 size={18} />
            <strong>Metadata routing</strong>
          </div>

          <label className="field">
            <span>Notebook</span>
            <input value={notebook} onChange={(event) => onNotebookChange(event.target.value)} />
          </label>

          <label className="field">
            <span>Primary domain</span>
            <select value={domain} onChange={(event) => onDomainChange(event.target.value)}>
              {recommendedDomains.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="chip-row">
            {recommendedDomains.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip-button ${item === domain ? 'is-selected' : ''}`}
                onClick={() => onDomainChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StageShell>
  );
}
