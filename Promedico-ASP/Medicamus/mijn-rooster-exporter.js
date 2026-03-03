// INTERSHIFT "MIJN ROOSTER" EXPORTER
// Copy and paste this into browser console (F12) on the "Mijn rooster" page
// URL: .../MijnInterShift_MijnRooster.asp

(function() {
    console.log('=== InterShift "Mijn Rooster" Exporter ===');
    
    // Find the diensten table
    const table = document.querySelector('#listDiensten');
    
    if (!table) {
        alert('❌ Geen diensten tabel gevonden. Zorg dat je op de "Mijn rooster" pagina bent.');
        console.error('Table #listDiensten not found');
        return;
    }

    const shifts = [];
    const rows = table.querySelectorAll('tbody tr');
    
    console.log(`Found ${rows.length} rows in table`);

    // Parse each row
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        
        if (cells.length < 4) return; // Skip invalid rows
        
        // Extract data from cells
        // Cell 1: Datum (Date)
        // Cell 2: Tijden (Times)
        // Cell 3: Dienst (Shift description with code)
        // Cell 4: Uren (Hours)
        
        const dateText = cells[1].textContent.trim(); // e.g., "15-6-2025"
        const timeText = cells[2].textContent.trim(); // e.g., "16:00-23:00" or "16.00 - 23.00"
        const dienstText = cells[3].textContent.trim(); // e.g., "AVW Avondvisitedienst weekend"
        const uren = cells[4].textContent.trim(); // e.g., "7,00"
        
        // Parse date (format: DD-MM-YYYY)
        const dateParts = dateText.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (!dateParts) {
            console.warn(`Could not parse date: ${dateText}`);
            return;
        }
        
        const day = parseInt(dateParts[1]);
        const month = parseInt(dateParts[2]) - 1; // JavaScript months are 0-indexed
        const year = parseInt(dateParts[3]);
        const date = new Date(year, month, day);
        
        // Parse times - handle both formats: "16:00-23:00" and "16.00 - 23.00"
        const timeMatch = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
        
        let startTime, endTime;
        if (timeMatch) {
            startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
        } else {
            console.warn(`Could not parse time: ${timeText}`);
            // Try to extract just HH:MM format
            const simpleTime = timeText.match(/(\d{1,2})[:.](\d{2})/g);
            if (simpleTime && simpleTime.length >= 2) {
                startTime = simpleTime[0].replace('.', ':');
                endTime = simpleTime[1].replace('.', ':');
            } else {
                return; // Skip this row
            }
        }
        
        // Extract shift code (first word of dienst)
        const shiftCode = dienstText.split(' ')[0];
        
        // Extract shift name (everything after the code)
        const shiftName = dienstText.substring(shiftCode.length).trim();
        
        shifts.push({
            date: date,
            dateStr: dateText,
            startTime: startTime,
            endTime: endTime,
            code: shiftCode,
            name: shiftName,
            fullDescription: dienstText,
            hours: uren
        });
        
        console.log(`✓ Parsed: ${dateText} ${startTime}-${endTime} ${shiftCode}`);
    });

    if (shifts.length === 0) {
        alert('❌ Geen diensten gevonden om te exporteren.');
        console.error('No shifts were parsed successfully');
        return;
    }

    console.log(`\n✅ Successfully parsed ${shifts.length} shifts`);
    
    // Show table preview
    console.table(shifts.map(s => ({
        Datum: s.dateStr,
        Tijd: `${s.startTime}-${s.endTime}`,
        Code: s.code,
        Dienst: s.name,
        Uren: s.hours
    })));

    // Generate ICS file
    function parseTime(dateObj, timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const result = new Date(dateObj);
        result.setHours(hours, minutes, 0, 0);
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
    ics += 'PRODID:-//HAP Harderwijk Medicamus//NL\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';
    ics += 'X-WR-CALNAME:HAP Diensten - Sebastiaan Roos\r\n';
    ics += 'X-WR-TIMEZONE:Europe/Amsterdam\r\n';
    ics += 'X-WR-CALDESC:HAP Harderwijk Medicamus diensten\r\n';
    
    shifts.forEach((shift, index) => {
        const startDate = parseTime(shift.date, shift.startTime);
        let endDate = parseTime(shift.date, shift.endTime);
        
        // Handle midnight (00:00) - this means next day
        if (shift.endTime === '00:00' || shift.endTime === '24:00') {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        // Handle overnight shifts (end time before start time)
        if (endDate <= startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        const uid = `hap-shift-${shift.date.getTime()}-${shift.code}-${index}@harderwijk.medicamus`;
        
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${uid}\r\n`;
        ics += `DTSTAMP:${formatICalDate(new Date())}\r\n`;
        ics += `DTSTART:${formatICalDate(startDate)}\r\n`;
        ics += `DTEND:${formatICalDate(endDate)}\r\n`;
        ics += `SUMMARY:${shift.code} - HAP Dienst\r\n`;
        ics += `DESCRIPTION:${shift.fullDescription}\\n`;
        ics += `Uren: ${shift.hours}\\n`;
        ics += `Tijd: ${shift.startTime} - ${shift.endTime}\r\n`;
        ics += `LOCATION:HAP Harderwijk Medicamus\r\n`;
        ics += 'STATUS:CONFIRMED\r\n';
        ics += 'TRANSP:OPAQUE\r\n';
        ics += 'CATEGORIES:HAP,Dienst,Werk\r\n';
        
        // Add alarm 1 day before at 20:00
        ics += 'BEGIN:VALARM\r\n';
        ics += 'TRIGGER:-P1DT4H\r\n';
        ics += 'ACTION:DISPLAY\r\n';
        ics += `DESCRIPTION:Morgen HAP dienst: ${shift.code}\r\n`;
        ics += 'END:VALARM\r\n';
        
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
    console.log('\n📅 Importeer dit bestand in:');
    console.log('  • Google Agenda (gmail.com → Agenda → Instellingen → Agenda\'s toevoegen)');
    console.log('  • Microsoft Outlook (Bestand → Openen en exporteren → Agenda importeren)');
    console.log('  • Apple Agenda (Bestand → Importeren)');
    console.log('  • Andere agenda-apps (zoek naar "importeer .ics bestand")');
    
    alert(`✅ ${shifts.length} HAP diensten geëxporteerd!\n\n📥 Bestand: ${filename}\n\n📅 Importeer dit .ics bestand in je agenda app.\n\nDe diensten bevatten ook herinneringen 1 dag van tevoren.`);

})();
