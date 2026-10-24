// congen-bug-report.js

function openBugModal() {
    document.getElementById('bugTitle').value = '';
    document.getElementById('bugDescription').value = '';
    document.getElementById('bugSteps').value = '';
    document.getElementById('bug-step-1').style.display = 'block';
    document.getElementById('bug-step-2').style.display = 'none';
    document.getElementById('bugModal').style.display = 'flex';
}

function closeBugModal() {
    document.getElementById('bugModal').style.display = 'none';
}

function handleBugSubmit() {
    const title = document.getElementById('bugTitle').value.trim();
    const desc = document.getElementById('bugDescription').value.trim();
    const steps = document.getElementById('bugSteps').value.trim();
    
    if (!title || !desc) {
        alert("Please provide at least a Title and Description for the bug report.");
        return;
    }

    if (confirm("Are you sure you want to generate this bug report?")) {
        let currentState = [];
        if (typeof getEditorState === 'function') {
            currentState = getEditorState();
        }

        const settings = window.ConGenState?.settings || {};
        const chosenColor = settings.outputTheme?.brand || settings.themeColor || (document.getElementById('accentColor') ? document.getElementById('accentColor').value : '#3498db');
        const logoData = settings.logoData || (document.getElementById('logoBase64') ? document.getElementById('logoBase64').value : '');

        const customCSS = settings.css || (document.getElementById('cssFilename') ? document.getElementById('cssFilename').value : '');


        const logoFilename = document.getElementById('logoFilename') ? document.getElementById('logoFilename').value : '';

        const payload = {
            metadata: {
                timestamp: new Date().toISOString(),
                title: title,
                description: desc,
                steps_to_reproduce: steps,
                userAgent: navigator.userAgent
            },
            editor_context: {
                state: currentState,
                color: chosenColor,
                logo_filename: logoFilename,
                css_filename: customCSS,
                has_logo_data: !!logoData
            },
            telemetry: window.conGenTelemetry || []
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `bug_report_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        // Transition to success screen
        document.getElementById('bug-step-1').style.display = 'none';
        document.getElementById('bug-step-2').style.display = 'block';
    }
}
