(function() {
    'use strict';

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    // Extract patient information from the page
    function extractPatientInfo() {
        let patientInfo = {
            bsn: null,
            geboortedatum: null,
            naam: null
        };

        let topBar = null;

        // Try parent window
        try {
            if (window.parent && window.parent.document) {
                topBar = window.parent.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
            }
        } catch(e) {}

        // Try top window
        if (!topBar) {
            try {
                if (window.top && window.top.document) {
                    topBar = window.top.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
                }
            } catch(e) {}
        }

        // Try current document
        if (!topBar) {
            topBar = document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
        }

        if (topBar) {
            const innerText = topBar.innerText;

            // Extract BSN
            const bsnMatch = innerText.match(/BSN:\s*(\d{8,9})/);
            if (bsnMatch && bsnMatch[1]) {
                patientInfo.bsn = bsnMatch[1];
            }

            // Extract geboortedatum (format: dd-mm-yyyy)
            const gbdMatch = innerText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/);
            if (gbdMatch && gbdMatch[1]) {
                patientInfo.geboortedatum = gbdMatch[1].replace(/\//g, '-');
            }

            // Extract naam (typically first line or before BSN)
            const lines = innerText.split('\n');
            if (lines.length > 0) {
                // First line usually contains the name
                patientInfo.naam = lines[0].trim();
            }
        }

        // Fallback: search entire page
        if (!patientInfo.bsn || !patientInfo.geboortedatum) {
            const searchWindows = [window.parent, window.top, window];

            for (let i = 0; i < searchWindows.length; i++) {
                try {
                    const win = searchWindows[i];
                    if (!win || !win.document || !win.document.body) continue;

                    const pageText = win.document.body.innerText;

                    // Try to find BSN if not found yet
                    if (!patientInfo.bsn) {
                        const bsnMatch = pageText.match(/BSN:\s*(\d{8,9})/);
                        if (bsnMatch && bsnMatch[1]) {
                            patientInfo.bsn = bsnMatch[1];
                        }
                    }

                    // Try to find geboortedatum if not found yet
                    if (!patientInfo.geboortedatum) {
                        const gbdMatch = pageText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/);
                        if (gbdMatch && gbdMatch[1]) {
                            patientInfo.geboortedatum = gbdMatch[1].replace(/\//g, '-');
                        }
                    }

                    if (patientInfo.bsn && patientInfo.geboortedatum) {
                        break;
                    }
                } catch(e) {}
            }
        }

        return patientInfo;
    }

    // Normalize date format for comparison
    function normalizeDate(dateStr) {
        if (!dateStr) return null;

        // Remove spaces and convert to lowercase
        dateStr = dateStr.trim().toLowerCase();

        // Handle formats like: 15-03-1985, 15/03/1985, 15-3-1985
        let match = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
        if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            return `${day}-${month}-${year}`;
        }

        // Handle format: 15 maart 1985, 15 mrt 1985
        const monthMap = {
            'januari': '01', 'jan': '01',
            'februari': '02', 'feb': '02',
            'maart': '03', 'mrt': '03', 'maa': '03',
            'april': '04', 'apr': '04',
            'mei': '05',
            'juni': '06', 'jun': '06',
            'juli': '07', 'jul': '07',
            'augustus': '08', 'aug': '08',
            'september': '09', 'sep': '09', 'sept': '09',
            'oktober': '10', 'okt': '10', 'oct': '10',
            'november': '11', 'nov': '11',
            'december': '12', 'dec': '12'
        };

        match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (match) {
            const day = match[1].padStart(2, '0');
            const monthName = match[2].toLowerCase();
            const month = monthMap[monthName] || match[2];
            const year = match[3];
            if (monthMap[monthName]) {
                return `${day}-${month}-${year}`;
            }
        }

        return dateStr;
    }

    // Parse pasted text to extract SOEP fields and patient info
    function parseConsultText(text) {
        const result = {
            bsn: null,
            geboortedatum: null,
            naam: null,
            s: '',
            o: '',
            e: '',
            p: ''
        };

        if (!text) return result;

        // First, extract BSN, geboortedatum, and naam from anywhere in text
        const bsnMatch = text.match(/BSN[:\s]*(\d{8,9})/i);
        if (bsnMatch) {
            result.bsn = bsnMatch[1];
        }

        const gbdMatch = text.match(/geboortedatum[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i);
        if (gbdMatch) {
            result.geboortedatum = normalizeDate(gbdMatch[1]);
        }

        const naamMatch = text.match(/naam[:\s]*([^\n\r]+)/i);
        if (naamMatch) {
            result.naam = naamMatch[1].trim();
        }

        // Now split text into sections using SOEP markers
        // Markers can be: S:/, S/, S:, S;, O:/, O/, O:, O;, etc.
        // We'll use a regex to find all markers and their positions

        // Create a pattern that matches SOEP markers (case insensitive)
        // Accepts :, /, ; as separators
        // Must be preceded by whitespace, start of string, or newline to avoid false positives
        // This prevents matching "faryngitis:" or "note:" etc.
        const markerPattern = /(^|[\s\n\r])([SOEP])[:\/;]\s*/gi;
        
        const markers = [];
        let match;
        
        // Find all markers and their positions
        while ((match = markerPattern.exec(text)) !== null) {
            markers.push({
                field: match[2].toLowerCase(), // match[2] because match[1] is the whitespace/start
                position: match.index + match[1].length, // Adjust position to skip the whitespace
                fullMatch: match[2] + match[0].substring(match[1].length + 1) // The actual marker part
            });
        }

        // If no markers found, try line-by-line parsing (original method)
        if (markers.length === 0) {
            const lines = text.split('\n');
            let currentField = null;

            for (let line of lines) {
                line = line.trim();
                if (!line) continue;

                // Skip lines with BSN, geboortedatum, naam
                if (/BSN|geboortedatum|naam/i.test(line)) continue;

                // Check for SOEP field markers at start of line
                // Accept S:, S/, S; etc. but only at start or after whitespace
                if (/^[SOEP][:\/;]\s*/i.test(line)) {
                    const fieldMatch = line.match(/^([SOEP])[:\/;]\s*/i);
                    if (fieldMatch) {
                        currentField = fieldMatch[1].toLowerCase();
                        line = line.replace(/^[SOEP][:\/;]\s*/i, '');
                    }
                }

                // Add line to current field
                if (currentField && line) {
                    if (result[currentField]) {
                        result[currentField] += '\n' + line;
                    } else {
                        result[currentField] = line;
                    }
                }
            }
        } else {
            // Parse using markers
            for (let i = 0; i < markers.length; i++) {
                const currentMarker = markers[i];
                const nextMarker = markers[i + 1];
                
                // Extract text between this marker and the next (or end of text)
                const startPos = currentMarker.position + currentMarker.fullMatch.length;
                const endPos = nextMarker ? nextMarker.position : text.length;
                
                let content = text.substring(startPos, endPos).trim();
                
                // Remove BSN, geboortedatum, naam lines from content
                content = content.replace(/BSN[:\s]*\d{8,9}/gi, '').trim();
                content = content.replace(/geboortedatum[:\s]*[\d\-\/]+/gi, '').trim();
                content = content.replace(/naam[:\s]*[^\n\r]+/gi, '').trim();
                
                if (content) {
                    result[currentMarker.field] = content;
                }
            }
        }

        // Trim all fields and normalize whitespace
        result.s = result.s.trim().replace(/\s+/g, ' ').replace(/ \n/g, '\n');
        result.o = result.o.trim().replace(/\s+/g, ' ').replace(/ \n/g, '\n');
        result.e = result.e.trim().replace(/\s+/g, ' ').replace(/ \n/g, '\n');
        result.p = result.p.trim().replace(/\s+/g, ' ').replace(/ \n/g, '\n');

        return result;
    }

    // Validate parsed data against patient info
    function validatePatientData(parsedData, patientInfo) {
        const warnings = [];
        const errors = [];

        // Check BSN if present in pasted text
        if (parsedData.bsn) {
            if (!patientInfo.bsn) {
                warnings.push('⚠️ Kan BSN op de pagina niet vinden om te vergelijken');
            } else if (parsedData.bsn !== patientInfo.bsn) {
                errors.push(`❌ BSN komt NIET overeen!\n   Pagina: ${patientInfo.bsn}\n   Geplakt: ${parsedData.bsn}`);
            }
        }

        // Check geboortedatum if present in pasted text
        if (parsedData.geboortedatum) {
            if (!patientInfo.geboortedatum) {
                warnings.push('⚠️ Kan geboortedatum op de pagina niet vinden om te vergelijken');
            } else {
                const normalizedPageGbd = normalizeDate(patientInfo.geboortedatum);
                const normalizedPastedGbd = normalizeDate(parsedData.geboortedatum);

                if (normalizedPageGbd !== normalizedPastedGbd) {
                    errors.push(`❌ Geboortedatum komt NIET overeen!\n   Pagina: ${patientInfo.geboortedatum}\n   Geplakt: ${parsedData.geboortedatum}`);
                }
            }
        }

        // Check naam if present (basic check - last name matching)
        if (parsedData.naam && patientInfo.naam) {
            // Extract last names for comparison (simple approach)
            const pastedLastName = parsedData.naam.split(/\s+/).pop().toLowerCase();
            const pageLastName = patientInfo.naam.split(/\s+/).pop().toLowerCase();

            if (!patientInfo.naam.toLowerCase().includes(pastedLastName)) {
                warnings.push(`⚠️ Naam lijkt niet overeen te komen\n   Pagina: ${patientInfo.naam}\n   Geplakt: ${parsedData.naam}`);
            }
        }

        return { warnings, errors };
    }

    // Insert text into SOEP field
    function insertText(fieldId, text) {
        if (!text) return false;

        const field = document.getElementById(fieldId);
        if (!field) {
            console.error('Field not found:', fieldId);
            return false;
        }

        // Add text on new line if field already has content
        if (field.value.trim()) {
            field.value += '\n' + text;
        } else {
            field.value = text;
        }

        // Trigger change events
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
    }

    // Apply parsed SOEP text to form fields
    function applyConsultText(parsedData) {
        let filled = 0;

        if (parsedData.s && insertText('contactForm.regelS', parsedData.s)) {
            filled++;
        }

        if (parsedData.o && insertText('contactForm.regelO', parsedData.o)) {
            filled++;
        }

        if (parsedData.e && insertText('contactForm.regelE', parsedData.e)) {
            filled++;
        }

        if (parsedData.p && insertText('contactForm.regelP', parsedData.p)) {
            filled++;
        }

        return filled;
    }

    // ============================================================================
    // UI CREATION
    // ============================================================================

    function showConsultPopup() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 100000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create popup
        const popup = document.createElement('div');
        popup.style.cssText = `
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            padding: 25px;
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Promedico Quick Consult';
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 24px;
            font-weight: bold;
        `;

        // Create instruction text
        const instruction = document.createElement('p');
        instruction.innerHTML = `
            Plak hier je consult tekst met SOEP indeling:<br>
            <small style="color: #7f8c8d;">
            • Gebruik <strong>S:/</strong>, <strong>O:/</strong>, <strong>E:/</strong>, <strong>P:/</strong><br>
            • Ook mogelijk: <strong>S:</strong>, <strong>O:</strong> of <strong>S;</strong>, <strong>O;</strong><br>
            • Werkt ook in één regel zonder enters<br>
            • Optioneel: vermeld <strong>BSN:</strong>, <strong>Geboortedatum:</strong>, <strong>Naam:</strong> voor controle
            </small>
        `;
        instruction.style.cssText = `
            margin: 0 0 15px 0;
            color: #555;
            line-height: 1.6;
        `;

        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = `Voorbeeld (met enters):
BSN: 123456789
Geboortedatum: 15-03-1985

S:/ Patiënt met hoofdpijn

O:/ Bloeddruk 120/80

E:/ Spanningshoofdpijn

P:/ Paracetamol 1000mg

Of in één regel:
BSN: 123456789 s/ Hoofdpijn O; Bloeddruk normaal e/ Spanning P: Rust`;
        textarea.style.cssText = `
            width: 100%;
            min-height: 300px;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
        `;

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        `;

        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Annuleren';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: 1px solid #ccc;
            background-color: #f8f9fa;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;

        cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#e9ecef';
        cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#f8f9fa';

        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
        };

        // Create submit button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Invoegen';
        submitBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            background-color: #28a745;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;

        submitBtn.onmouseover = () => submitBtn.style.backgroundColor = '#218838';
        submitBtn.onmouseout = () => submitBtn.style.backgroundColor = '#28a745';

        submitBtn.onclick = () => {
            const text = textarea.value.trim();

            if (!text) {
                alert('⚠️ Plak eerst de consult tekst in het tekstveld');
                return;
            }

            // Parse the text
            const parsedData = parseConsultText(text);

            // Check if any SOEP data was found
            if (!parsedData.s && !parsedData.o && !parsedData.e && !parsedData.p) {
                alert('⚠️ Geen SOEP data gevonden in de tekst.\n\nZorg ervoor dat je S:, O:, E:, P: gebruikt\n(of S:/, O:/, S;, O; etc.)\n\nOok in één regel mogelijk!');
                return;
            }

            // Get current patient info
            const patientInfo = extractPatientInfo();

            // Validate
            const validation = validatePatientData(parsedData, patientInfo);

            // Show errors if any
            if (validation.errors.length > 0) {
                const errorMsg = 'FOUT - Patiënt komt niet overeen!\n\n' + validation.errors.join('\n\n');
                const proceed = confirm(errorMsg + '\n\n⚠️ WEET JE ZEKER DAT JE DOOR WILT GAAN?');

                if (!proceed) {
                    return;
                }
            }

            // Show warnings if any (but don't block)
            if (validation.warnings.length > 0) {
                const warningMsg = validation.warnings.join('\n\n');
                alert('Let op:\n\n' + warningMsg);
            }

            // Apply the text to fields
            const filled = applyConsultText(parsedData);

            // Close popup
            document.body.removeChild(overlay);

            // Show success message
            if (filled > 0) {
                const notification = document.createElement('div');
                notification.textContent = `✓ ${filled} SOEP veld${filled > 1 ? 'en' : ''} ingevuld!`;
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #28a745;
                    color: white;
                    padding: 15px 25px;
                    border-radius: 4px;
                    z-index: 100001;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                `;
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.remove();
                }, 3000);
            } else {
                alert('⚠️ Geen velden ingevuld. Controleer of de SOEP velden op de pagina aanwezig zijn.');
            }
        };

        // Assemble popup
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(submitBtn);

        popup.appendChild(title);
        popup.appendChild(instruction);
        popup.appendChild(textarea);
        popup.appendChild(buttonContainer);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Focus textarea
        textarea.focus();

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function createQuickConsultButton() {
        // Check if button already exists
        if (document.getElementById('quick-consult-btn')) {
            return;
        }

        // Find the contactcontent div
        const contactContent = document.getElementById('contactcontent');
        if (!contactContent) {
            return;
        }

        // Create button as floating emergency button
        const button = document.createElement('button');
        button.id = 'quick-consult-btn';
        button.type = 'button';
        button.innerHTML = '💥 Consult Invoeren Na Crash';
        button.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            padding: 8px 16px;
            background-color: #dc3545;
            color: white;
            border: 1px solid #bd2130;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            transition: all 0.2s;
            z-index: 1000;
        `;

        button.onmouseover = () => {
            button.style.backgroundColor = '#c82333';
            button.style.boxShadow = '0 3px 8px rgba(0,0,0,0.3)';
            button.style.transform = 'translateY(-1px)';
        };
        
        button.onmouseout = () => {
            button.style.backgroundColor = '#dc3545';
            button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            button.style.transform = 'translateY(0)';
        };

        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showConsultPopup();
        };

        // Make sure contactcontent has position relative
        const currentPosition = window.getComputedStyle(contactContent).position;
        if (currentPosition === 'static') {
            contactContent.style.position = 'relative';
        }

        // Add button to contactcontent
        contactContent.appendChild(button);
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function initialize() {
        // Wait for contactcontent div to be available
        const checkInterval = setInterval(() => {
            const contactContent = document.getElementById('contactcontent');
            if (contactContent) {
                clearInterval(checkInterval);
                createQuickConsultButton();
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();