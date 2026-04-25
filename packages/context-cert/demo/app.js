document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const pageMeta = {
        'nav-dashboard': { title: 'Program Dashboard', subtitle: 'Monitoring medical certification excellence pipeline' },
        'nav-cli': { title: 'CLI Playground', subtitle: 'Interactive command-line tool demonstration' },
        'nav-reviewer': { title: 'Quiz Reviewer', subtitle: 'Administrative interface for content validation' },
        'nav-eval': { title: 'Ratchet Evaluation', subtitle: 'Automated quality regression testing' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update content
            const targetId = item.id;
            const tabId = targetId.replace('nav-', 'tab-');
            
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');

            // Update headers
            if (pageMeta[targetId]) {
                pageTitle.textContent = pageMeta[targetId].title;
                pageSubtitle.textContent = pageMeta[targetId].subtitle;
            }
        });
    });

    // Mock terminal typing effect
    const terminalOutput = document.getElementById('terminal-output');
    if (terminalOutput) {
        // Just a static demonstration for now, but could be made interactive
    }

    // Interactive Quiz Selection
    const listItems = document.querySelectorAll('.list-item');
    listItems.forEach(item => {
        item.addEventListener('click', () => {
            listItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            
            const title = item.querySelector('.item-title').textContent;
            document.querySelector('.preview-header h3').textContent = `Quiz Preview: ${title.split('.')[0]}`;
        });
    });
});
