import { AnimatePresence } from 'framer-motion';
import { createVirtualFile, buildGateDemoArtifact, clinicalCuratorTheme } from 'context-med-gate';
import { startTransition, useEffect, useEffectEvent, useState, type CSSProperties } from 'react';
import { ProcessRail } from './components/ProcessRail';
import { UploadStage } from './components/UploadStage';
import { AnalyzingStage } from './components/AnalyzingStage';
import { ReviewStage } from './components/ReviewStage';
import { SuccessStage } from './components/SuccessStage';
import type { FlowState } from './types';

const initialState: FlowState = {
  stage: 'upload',
  artifact: null,
  uploadedFile: null,
  activeAnalysisStep: 0,
  note: 'Demo starts with a browser-side upload and package-backed artifact generation.',
  domain: 'Oncology',
  notebook: 'node-alpha-02',
};

function App() {
  const [flow, setFlow] = useState<FlowState>(initialState);

  const advanceToReview = useEffectEvent(async (file: File, domain: string, notebook: string) => {
    const artifact = await buildGateDemoArtifact(file, { domain, notebook });

    for (let step = 0; step < 4; step += 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 520);
      });

      startTransition(() => {
        setFlow((current) => ({
          ...current,
          activeAnalysisStep: step,
          artifact,
          note: `Completed ${artifact.completed_steps[step] ?? 'analysis step'}.`,
        }));
      });
    }

    window.setTimeout(() => {
      startTransition(() => {
        setFlow((current) => ({
          ...current,
          stage: 'hitl',
          artifact,
          note: 'Review packet assembled. Human sign-off is now required.',
        }));
      });
    }, 180);
  });

  useEffect(() => {
    const file = flow.uploadedFile;

    if (flow.stage !== 'analyzing' || !file) {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      await advanceToReview(file, flow.domain, flow.notebook);
      if (isCancelled) {
        return;
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [flow.domain, flow.notebook, flow.stage, flow.uploadedFile]);

  useEffect(() => {
    const boot = async () => {
      const demoFile = await createVirtualFile(
        'context-gate-demo-note.txt',
        'Context Gate browser adapter bootstraps a realistic intake flow using package exports, a browser-side SHA-256 digest, and a review packet that mirrors the CLI profile shape.',
      );
      setFlow((current) => ({
        ...current,
        note: `Ready for ${demoFile.name}. Upload your own file or follow the built-in scenario.`,
      }));
    };

    boot();
  }, []);

  const handleFileSelect = (file: File) => {
    startTransition(() => {
      setFlow((current) => ({
        ...current,
        uploadedFile: file,
        stage: 'analyzing',
        activeAnalysisStep: 0,
        artifact: null,
        note: `${file.name} entered the analysis pipeline.`,
      }));
    });
  };

  const handleApprove = () => {
    startTransition(() => {
      setFlow((current) => ({
        ...current,
        stage: 'success',
        note: 'Artifact approved and staged for raw delivery.',
      }));
    });
  };

  const handleReject = () => {
    startTransition(() => {
      setFlow((current) => ({
        ...initialState,
        domain: current.domain,
        notebook: current.notebook,
        note: 'Review flagged the document for re-analysis. Upload a new artifact to continue.',
      }));
    });
  };

  const handleReset = () => {
    startTransition(() => {
      setFlow((current) => ({
        ...initialState,
        domain: current.domain,
        notebook: current.notebook,
        note: 'Workflow reset. A fresh upload can begin.',
      }));
    });
  };

  return (
    <div
      className="app-shell"
      style={
        {
          '--theme-primary': clinicalCuratorTheme.colors.primaryStrong,
          '--theme-secondary': clinicalCuratorTheme.colors.secondary,
        } as CSSProperties
      }
    >
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <ProcessRail stage={flow.stage} />

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Package-backed demo</p>
            <h1>Context Gate browser walkthrough</h1>
          </div>
          <p>{flow.note}</p>
        </header>

        <AnimatePresence mode="wait">
          {flow.stage === 'upload' && (
            <UploadStage
              domain={flow.domain}
              notebook={flow.notebook}
              onDomainChange={(value) => setFlow((current) => ({ ...current, domain: value }))}
              onNotebookChange={(value) =>
                setFlow((current) => ({ ...current, notebook: value || 'node-alpha-02' }))
              }
              onFileSelect={handleFileSelect}
            />
          )}

          {flow.stage === 'analyzing' && (
            <AnalyzingStage artifact={flow.artifact} activeStep={flow.activeAnalysisStep} />
          )}

          {flow.stage === 'hitl' && flow.artifact && (
            <ReviewStage artifact={flow.artifact} onApprove={handleApprove} onReject={handleReject} />
          )}

          {flow.stage === 'success' && flow.artifact && (
            <SuccessStage artifact={flow.artifact} onReset={handleReset} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
