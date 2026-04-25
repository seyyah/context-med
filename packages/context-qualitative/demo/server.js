const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// We use the pipeline from our package
const { processBatch, buildOutput } = require('../src/pipeline');

const app = express();
const port = 3000;

// Setup static file serving (for index.html and app.js)
app.use(express.static(__dirname));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// In-memory job tracker
const jobs = {};

// Helper: Read texts from uploaded file
function extractTexts(filePath, originalName) {
  try {
    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
      const XLSX = require('xlsx');
      const wb = XLSX.readFile(filePath);
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      return data.map(r => r.text_data || r.Text || r.text || r.content).filter(Boolean);
    } else {
      return [fs.readFileSync(filePath, 'utf-8').trim()];
    }
  } catch (e) {
    return [];
  }
}

// Upload Endpoint
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  const jobId = Date.now().toString();
  
  // Initialize job state
  jobs[jobId] = {
    status: 'running',
    progress: 0,
    logs: ['[Orchestrator] System initialized. Received analysis request.'],
    results: null
  };
  
  res.json({ jobId });

  // Custom logger to pipe logs directly to the job state
  const logger = {
    info: (msg) => { jobs[jobId].logs.push(`[INFO] ${msg}`); console.log(`[${jobId}] INFO: ${msg}`); },
    warn: (msg) => { jobs[jobId].logs.push(`[WARN] ${msg}`); console.warn(`[${jobId}] WARN: ${msg}`); },
    error: (msg) => { jobs[jobId].logs.push(`[ERROR] ${msg}`); console.error(`[${jobId}] ERROR: ${msg}`); },
    debug: () => {}
  };

  try {
    let texts = req.file ? extractTexts(req.file.path, req.file.originalname) : [];
    
    // If empty or parsing failed, provide a realistic medical dataset for the demo
    if (texts.length === 0) {
      logger.info('No valid text found in upload. Using demo dataset (3 texts).');
      texts = [
        "Patient presented with severe migraines and occasional nausea. No family history of neurological disorders.",
        "Post-operative recovery is normal, though the patient reports mild insomnia and anxiety at night.",
        "The subject experienced a localized rash and itching after the first dose of the trial medication."
      ];
    } else {
      logger.info(`Extracted ${texts.length} entries from ${req.file.originalname}`);
    }

    // Run MapReduce Pipeline
    const results = await processBatch(texts, {
      batchSize: 2,
      logger,
      onProgress: (processed, total) => {
        jobs[jobId].progress = Math.round((processed / total) * 100);
      }
    });

    jobs[jobId].status = 'done';
    jobs[jobId].progress = 100;
    jobs[jobId].results = buildOutput(results);
    jobs[jobId].logs.push('[Orchestrator] SUCCESS: MapReduce synthesis completed successfully.');

  } catch (err) {
    jobs[jobId].status = 'error';
    jobs[jobId].logs.push(`[Orchestrator] FATAL ERROR: ${err.message}`);
  }
});

// Status Polling Endpoint
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  // Send status, progress, and logs
  res.json({
    status: job.status,
    progress: job.progress,
    logs: job.logs,
    results: job.results
  });
});

app.listen(port, () => {
  console.log(`Med-AgentLab Monitor is running on http://localhost:${port}`);
});
