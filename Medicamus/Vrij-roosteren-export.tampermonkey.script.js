// ==UserScript==
// @name         InterShift Schedule to ICS Exporter
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Extract your shifts from InterShift Vrij roosteren fase and export as ICS calendar file
// @match        https://medicamus.intershift.nl/SELECT/app/MijnIntershift_beschikbaarheid.asp*
// @match        https://*/app/MijnIntershift_beschikbaarheid.asp*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Shift definitions with times
    const SHIFT_DEFINITIONS = {
        'ACW': { name: 'Avondconsultdienst weekend', start: '16:00', end: '23:00', duration: 7 },
        'C5': { name: 'C5 Avondconsultdienst weekend', start: '18:00', end: '24:00', duration: 6 },
        'AVW': { name: 'Avondvisitedienst weekend', start: '16:00', end: '24:00', duration: 8 },
        'AC': { name: 'Avondconsultdienst', start: '16:00', end: '23:00', duration: 7 },
        'AV': { name: 'Avondvisitedienst', start: '16:00', end: '24:00', duration: 8 },
        'AWA': { name: 'Achterwacht avond', start: '18:00', end: '24:00', duration: 6 },
        'AWAN': { name: 'Achterwacht Avond & Nacht', start: '18:00', end: '08:00', duration: 14 },
        'AWD': { name: 'Achterwacht dag weekend/feestdagen', start: '08:00', end: '18:00', duration: 10 },
        'AWN': { name: 'Achterwacht nacht', start: '00:00', end: '08:00', duration: 8 },
        'C0': { name: 'Visite-Consultdienst', start: '08:00', end: '17:00', duration: 9 },
        'C1': { name: 'Consult-visitedienst', start: '08:00', end: '17:00', duration: 9 },
        'C2': { name: '2e Consultdienst', start: '08:00', end: '17:00', duration: 9 },
        'C3': { name: '3e Consultdienst', start: '08:00', end: '17:00', duration: 9 },
        'C4': { name: 'Extra consultdienst', start: '08:00', end: '17:00', duration: 9 },
        'N': { name: 'Nachtdienst', start: '23:00', end: '08:00', duration: 9 },
        'RAA': { name: 'Regiearts avond', start: '17:00', end: '24:00', duration: 7 },
        'RAD': { name: 'Regiearts dag', start: '08:00', end: '17:00', duration: 9 },
        'RAV': { name: 'Regiearts vrijdag', start: '17:00', end: '24:00', duration: 7 }
    };

    // Month names in Dutch
    const MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                       'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

    // Add export button to the page
    function addExportButton() {
        // Find a good place to add the button
        const toolbar = document.querySelector('.divBtns ul.nav-tabs');
        if (!toolbar) {
            console.log('Could not find toolbar, trying alternative location...');
            addFloatingButton();
            return;
        }

        const li = document.createElement('li');
        li.style.float = 'right';

        const btn = document.createElement('a');
        btn.className = 'btn btn-default';
        btn.innerHTML = '📅 Export naar Agenda';
        btn.style.cursor = 'pointer';
        btn.onclick = extractAndExport;

        li.appendChild(btn);
        toolbar.appendChild(li);

        console.log('Export button added successfully!');
    }

    // Fallback: Add floating button
    function addFloatingButton() {
        const btn = document.createElement('button');
        btn.innerHTML = '📅 Export naar Agenda';
        btn.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            padding: 12px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        btn.onmouseover = () => btn.style.background = '#45a049';
        btn.onmouseout = () => btn.style.background = '#4CAF50';
        btn.onclick = extractAndExport;
        document.body.appendChild(btn);
        console.log('Floating export button added!');
    }

    // Parse Dutch date from table header
    function parseDutchMonth(monthStr) {
        const cleanMonth = monthStr.toLowerCase().trim();
        return MONTHS_NL.indexOf(cleanMonth);
    }

    // Extract shifts from the schedule
    function extractShifts() {
        const shifts = [];
        const container = document.querySelector('#container');

        if (!container) {
            console.error('Container not found');
            return shifts;
        }

        // Look for all table cells with shift codes
        const allCells = container.querySelectorAll('td');

        console.log(`Found ${allCells.length} table cells to check`);

        allCells.forEach(cell => {
            const text = cell.textContent.trim();

            // Check if this cell contains a known shift code
            if (SHIFT_DEFINITIONS[text]) {
                // Extract date from ID attribute: "dag_1864_10-1-2026"
                const cellId = cell.id;
                let date = null;

                if (cellId) {
                    const dateMatch = cellId.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);

                    if (dateMatch) {
                        const day = parseInt(dateMatch[1]);
                        const month = parseInt(dateMatch[2]) - 1;
                        const year = parseInt(dateMatch[3]);
                        date = new Date(year, month, day);
                    }
                }

                // Fallback: try to extract from class attribute
                if (!date) {
                    const classes = cell.className;
                    const classDateMatch = classes.match(/date(\d{1,2})-(\d{1,2})-(\d{4})/);

                    if (classDateMatch) {
                        const day = parseInt(classDateMatch[1]);
                        const month = parseInt(classDateMatch[2]) - 1;
                        const year = parseInt(classDateMatch[3]);
                        date = new Date(year, month, day);
                    }
                }

                if (date) {
                    shifts.push({
                        date: date,
                        code: text,
                        ...SHIFT_DEFINITIONS[text]
                    });
                    console.log(`Found shift: ${text} on ${date.toLocaleDateString('nl-NL')}`);
                }
            }
        });

        return shifts;
    }

    // Convert time string to date
    function parseTime(dateObj, timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const result = new Date(dateObj);

        // Handle next-day times (24:00 becomes 00:00 next day)
        if (hours >= 24) {
            result.setDate(result.getDate() + 1);
            result.setHours(hours - 24, minutes, 0, 0);
        } else {
            result.setHours(hours, minutes, 0, 0);
        }

        return result;
    }

    // Format date for iCalendar (YYYYMMDDTHHMMSS)
    function formatICalDate(date) {
        const pad = (n) => String(n).padStart(2, '0');
        return date.getFullYear() +
               pad(date.getMonth() + 1) +
               pad(date.getDate()) + 'T' +
               pad(date.getHours()) +
               pad(date.getMinutes()) +
               pad(date.getSeconds());
    }

    // Generate ICS file content
    function generateICS(shifts) {
        let ics = 'BEGIN:VCALENDAR\r\n';
        ics += 'VERSION:2.0\r\n';
        ics += 'PRODID:-//InterShift Schedule Exporter//NL\r\n';
        ics += 'CALSCALE:GREGORIAN\r\n';
        ics += 'METHOD:PUBLISH\r\n';
        ics += 'X-WR-CALNAME:HAP Diensten\r\n';
        ics += 'X-WR-TIMEZONE:Europe/Amsterdam\r\n';

        shifts.forEach((shift, index) => {
            const startDate = parseTime(shift.date, shift.start);
            const endDate = parseTime(shift.date, shift.end);

            // Handle overnight shifts
            if (endDate <= startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }

            const uid = `shift-${shift.date.getTime()}-${shift.code}-${index}@intershift`;

            ics += 'BEGIN:VEVENT\r\n';
            ics += `UID:${uid}\r\n`;
            ics += `DTSTAMP:${formatICalDate(new Date())}\r\n`;
            ics += `DTSTART:${formatICalDate(startDate)}\r\n`;
            ics += `DTEND:${formatICalDate(endDate)}\r\n`;
            ics += `SUMMARY:${shift.code} - ${shift.name}\r\n`;
            ics += `DESCRIPTION:Dienst: ${shift.name}\\nCode: ${shift.code}\\nDuur: ${shift.duration} uur\r\n`;
            ics += `LOCATION:HAP Harderwijk Medicamus\r\n`;
            ics += 'STATUS:CONFIRMED\r\n';
            ics += 'TRANSP:OPAQUE\r\n';
            ics += 'END:VEVENT\r\n';
        });

        ics += 'END:VCALENDAR\r\n';
        return ics;
    }

    // Download ICS file
    function downloadICS(content, filename) {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Main extraction and export function
    function extractAndExport() {
        console.log('Starting extraction...');

        const shifts = extractShifts();

        if (shifts.length === 0) {
            alert('Geen diensten gevonden om te exporteren.\n\nMogelijke oorzaken:\n- Het rooster is nog niet geladen\n- Er zijn geen diensten gepland\n- De pagina structuur is gewijzigd\n\nProbeer de pagina te herladen.');
            console.log('No shifts found. Check the page structure.');
            return;
        }

        console.log(`Found ${shifts.length} shifts`);

        // Sort shifts by date
        shifts.sort((a, b) => a.date - b.date);

        // Generate ICS content
        const icsContent = generateICS(shifts);

        // Generate filename with date range
        const firstDate = shifts[0].date;
        const lastDate = shifts[shifts.length - 1].date;
        const filename = `HAP-diensten-${firstDate.getFullYear()}-${String(firstDate.getMonth()+1).padStart(2,'0')}_${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}.ics`;

        // Download
        downloadICS(icsContent, filename);

        alert(`✅ ${shifts.length} diensten geëxporteerd naar ${filename}\n\nImporteer dit bestand in:\n- Google Agenda\n- Outlook\n- Apple Agenda\n- Andere agenda apps`);
    }

    // Initialize when page is ready
    function init() {
        // Wait for the schedule to load
        const checkSchedule = setInterval(() => {
            const container = document.querySelector('#container table');
            if (container) {
                clearInterval(checkSchedule);
                addExportButton();
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkSchedule), 10000);
    }

    // Start the script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
