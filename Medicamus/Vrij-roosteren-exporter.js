// INTERSHIFT CALENDAR EXPORTER - FIXED VERSION
// Copy and paste this entire script into your browser console (F12 -> Console tab)

(function() {
    console.log('=== InterShift Calendar Exporter - FIXED ===');
    
    // Shift definitions
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

    // Find container
    const container = document.querySelector('#container');
    if (!container) {
        console.error('❌ Container not found');
        return;
    }

    // Find all TD cells
    const allCells = container.querySelectorAll('td');
    console.log(`Found ${allCells.length} cells to check`);

    // Extract shifts
    const shifts = [];
    
    allCells.forEach(cell => {
        const text = cell.textContent.trim();
        
        // Check if this is a known shift code
        if (SHIFT_DEFINITIONS[text]) {
            // Extract date from ID attribute: "dag_1864_10-1-2026"
            const cellId = cell.id;
            
            if (cellId) {
                // Try to extract date from various possible formats
                let dateMatch = cellId.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
                
                if (dateMatch) {
                    const day = parseInt(dateMatch[1]);
                    const month = parseInt(dateMatch[2]) - 1; // JavaScript months are 0-indexed
                    const year = parseInt(dateMatch[3]);
                    
                    const date = new Date(year, month, day);
                    
                    shifts.push({
                        code: text,
                        date: date,
                        dateStr: date.toLocaleDateString('nl-NL'),
                        ...SHIFT_DEFINITIONS[text]
                    });
                    
                    console.log(`✓ Found: ${text} on ${date.toLocaleDateString('nl-NL')}`);
                } else {
                    console.log(`⚠ Could not parse date from ID: ${cellId}`);
                }
            } else {
                // Try alternative: look for class with date
                const classes = cell.className;
                const classDateMatch = classes.match(/date(\d{1,2})-(\d{1,2})-(\d{4})/);
                
                if (classDateMatch) {
                    const day = parseInt(classDateMatch[1]);
                    const month = parseInt(classDateMatch[2]) - 1;
                    const year = parseInt(classDateMatch[3]);
                    
                    const date = new Date(year, month, day);
                    
                    shifts.push({
                        code: text,
                        date: date,
                        dateStr: date.toLocaleDateString('nl-NL'),
                        ...SHIFT_DEFINITIONS[text]
                    });
                    
                    console.log(`✓ Found: ${text} on ${date.toLocaleDateString('nl-NL')} (from class)`);
                } else {
                    console.log(`⚠ Shift ${text} has no date info in ID or class`);
                }
            }
        }
    });

    console.log(`\n✅ Total shifts extracted: ${shifts.length}`);
    
    if (shifts.length === 0) {
        console.error('❌ No shifts found');
        return;
    }

    // Sort by date
    shifts.sort((a, b) => a.date - b.date);

    // Show table
    console.table(shifts.map(s => ({
        Datum: s.dateStr,
        Code: s.code,
        Dienst: s.name,
        Tijd: `${s.start} - ${s.end}`,
        Duur: `${s.duration}u`
    })));

    // Generate ICS file
    function parseTime(dateObj, timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const result = new Date(dateObj);
        
        if (hours >= 24) {
            result.setDate(result.getDate() + 1);
            result.setHours(hours - 24, minutes, 0, 0);
        } else {
            result.setHours(hours, minutes, 0, 0);
        }
        
        return result;
    }

    function formatICalDate(date) {
        const pad = (n) => String(n).padStart(2, '0');
        return date.getFullYear() +
               pad(date.getMonth() + 1) +
               pad(date.getDate()) + 'T' +
               pad(date.getHours()) +
               pad(date.getMinutes()) +
               pad(date.getSeconds());
    }

    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//InterShift HAP Schedule//NL\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';
    ics += 'X-WR-CALNAME:HAP Diensten 2026\r\n';
    ics += 'X-WR-TIMEZONE:Europe/Amsterdam\r\n';
    ics += 'X-WR-CALDESC:HAP Harderwijk Medicamus diensten\r\n';
    
    shifts.forEach((shift, index) => {
        const startDate = parseTime(shift.date, shift.start);
        const endDate = parseTime(shift.date, shift.end);
        
        // Handle overnight shifts
        if (endDate <= startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        const uid = `hap-${shift.date.getTime()}-${shift.code}-${index}@harderwijk`;
        
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${uid}\r\n`;
        ics += `DTSTAMP:${formatICalDate(new Date())}\r\n`;
        ics += `DTSTART:${formatICalDate(startDate)}\r\n`;
        ics += `DTEND:${formatICalDate(endDate)}\r\n`;
        ics += `SUMMARY:${shift.code} - HAP Dienst\r\n`;
        ics += `DESCRIPTION:${shift.name}\\n`;
        ics += `Code: ${shift.code}\\n`;
        ics += `Duur: ${shift.duration} uur\\n`;
        ics += `Tijd: ${shift.start} - ${shift.end}\r\n`;
        ics += `LOCATION:HAP Harderwijk Medicamus\r\n`;
        ics += 'STATUS:CONFIRMED\r\n';
        ics += 'TRANSP:OPAQUE\r\n';
        ics += 'CATEGORIES:HAP,Dienst,Werk\r\n';
        ics += 'END:VEVENT\r\n';
    });
    
    ics += 'END:VCALENDAR\r\n';
    
    // Download the file
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const firstDate = shifts[0].date;
    const lastDate = shifts[shifts.length - 1].date;
    const filename = `HAP-diensten-${firstDate.getFullYear()}-${String(firstDate.getMonth()+1).padStart(2,'0')}-tot-${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}.ics`;
    
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`\n📥 DOWNLOADED: ${filename}`);
    console.log(`\n✅ SUCCESS! ${shifts.length} diensten geëxporteerd naar ICS bestand.`);
    console.log('\nImporteer dit bestand in:');
    console.log('  • Google Agenda');
    console.log('  • Microsoft Outlook');
    console.log('  • Apple Agenda');
    console.log('  • Andere agenda-apps');
    
    alert(`✅ ${shifts.length} HAP diensten geëxporteerd!\n\nBestand: ${filename}\n\nImporteer dit .ics bestand in je agenda app.`);

})();
