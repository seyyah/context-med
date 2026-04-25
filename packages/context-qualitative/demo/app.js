document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const initBtn = document.getElementById('initBtn');
    const progressFill = document.getElementById('progressFill');
    const consoleOutput = document.getElementById('console-output');
    
    // Clear mock logs on load
    consoleOutput.innerHTML = '<div class="text-outline">System initialized. Awaiting orchestration signals...</div>';

    let currentJobId = null;
    let pollTimer = null;

    initBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        initBtn.disabled = true;
        initBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Uploading...';
        appendLog(`[Orchestrator] Initiating upload for ${file.name}...`, 'primary');

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            
            currentJobId = data.jobId;
            appendLog(`[Orchestrator] Job ${currentJobId} created. Starting pipeline.`, 'success');
            
            initBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Processing...';
            
            // Start polling
            pollTimer = setInterval(pollStatus, 1000);
        } catch (err) {
            appendLog(`[ERROR] ${err.message}`, 'error');
            resetBtn();
        }
    });

    async function pollStatus() {
        if (!currentJobId) return;

        try {
            const res = await fetch(`/api/status/${currentJobId}`);
            const data = await res.json();

            // Update progress bar
            if (progressFill) {
                progressFill.style.width = data.progress + '%';
            }

            // Render new logs
            if (data.logs && data.logs.length > 0) {
                // Clear and rewrite for simplicity in demo
                consoleOutput.innerHTML = '';
                data.logs.forEach(log => {
                    let color = 'outline';
                    if (log.includes('[INFO]')) color = 'secondary-fixed-dim';
                    if (log.includes('[SUCCESS]')) color = '#34a853';
                    if (log.includes('[ERROR]') || log.includes('[FATAL]')) color = 'error';
                    if (log.includes('[Orchestrator]')) color = 'primary-fixed-dim';
                    
                    const div = document.createElement('div');
                    div.style.color = color.startsWith('#') ? color : `var(--${color}, #ccc)`;
                    div.textContent = log;
                    consoleOutput.appendChild(div);
                });
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }

            if (data.status === 'done') {
                clearInterval(pollTimer);
                appendLog('[Orchestrator] All agents completed successfully.', 'success');
                resetBtn('Analysis Complete', 'check');
                
                // Show results (simplified for demo)
                setTimeout(() => {
                    alert('Analysis complete! Check console for raw JSON data.');
                    console.log('Results:', data.results);
                }, 500);
            } else if (data.status === 'error') {
                clearInterval(pollTimer);
                appendLog('[Orchestrator] Pipeline halted due to error.', 'error');
                resetBtn();
            }

        } catch (err) {
            console.error('Polling error', err);
        }
    }

    function appendLog(msg, type = 'default') {
        const div = document.createElement('div');
        if (type === 'primary') div.classList.add('text-primary-fixed-dim');
        else if (type === 'success') div.classList.add('text-[#34a853]');
        else if (type === 'error') div.classList.add('text-error');
        else div.classList.add('text-outline');
        
        div.textContent = msg;
        consoleOutput.appendChild(div);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function resetBtn(text = 'Initialize Analysis', icon = 'add') {
        initBtn.disabled = false;
        initBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">${icon}</span> ${text}`;
    }
});
