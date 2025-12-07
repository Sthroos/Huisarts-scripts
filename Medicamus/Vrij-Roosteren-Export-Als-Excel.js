// INTERSHIFT "VRIJ ROOSTEREN" TO EXCEL/SPREADSHEET EXPORTER
// Copy and paste this into browser console (F12) on the "Vrij roosteren" page
// Exports to XLSX format (Excel, LibreOffice Calc, Google Sheets compatible)

(function() {
    console.log('=== InterShift "Vrij Roosteren" to Excel Exporter ===');
    
    // Load SheetJS library if not already loaded
    if (typeof XLSX === 'undefined') {
        console.log('Loading SheetJS library...');
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.onload = function() {
            console.log('✅ SheetJS loaded successfully');
            exportToExcel();
        };
        script.onerror = function() {
            console.error('❌ Failed to load SheetJS library');
            alert('Kon Excel library niet laden. Controleer je internetverbinding.');
        };
        document.head.appendChild(script);
    } else {
        exportToExcel();
    }

    function exportToExcel() {
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

        // Find container
        const container = document.querySelector('#container');
        
        if (!container) {
            alert('❌ Geen rooster gevonden. Zorg dat je op de "Vrij roosteren" pagina bent en het rooster geladen is.');
            console.error('Container not found');
            return;
        }

        // Extract shifts
        const shifts = [];
        const allCells = container.querySelectorAll('td');
        
        console.log(`Found ${allCells.length} cells to check`);

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
                    const shiftInfo = SHIFT_DEFINITIONS[text];
                    
                    // Format date as DD-MM-YYYY
                    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                    
                    // Day of week
                    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
                    const dayOfWeek = dayNames[date.getDay()];
                    
                    // Weekend check
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6 ? 'Ja' : 'Nee';
                    
                    // Month name
                    const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                                       'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
                    const monthName = monthNames[date.getMonth()];
                    
                    // Week number
                    function getWeekNumber(d) {
                        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
                        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                        return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
                    }
                    const weekNumber = getWeekNumber(date);
                    
                    // Check if shift is selected (has certain classes)
                    const isSelected = cell.classList.contains('btn-success') || 
                                      cell.classList.contains('selected') ||
                                      cell.style.backgroundColor.includes('green');
                    
                    const status = isSelected ? 'Ingeschreven' : 'Beschikbaar';
                    
                    shifts.push({
                        'Datum': dateStr,
                        'Dag': dayOfWeek,
                        'Week': weekNumber,
                        'Maand': monthName,
                        'Weekend': isWeekend,
                        'Code': text,
                        'Dienst': shiftInfo.name,
                        'Begintijd': shiftInfo.start,
                        'Eindtijd': shiftInfo.end,
                        'Uren': shiftInfo.duration,
                        'Status': status,
                        '_sortDate': date
                    });
                    
                    console.log(`✓ Found: ${dateStr} ${text} (${status})`);
                }
            }
        });

        if (shifts.length === 0) {
            alert('❌ Geen diensten gevonden om te exporteren.\n\nMogelijke oorzaken:\n- Het rooster is nog niet geladen\n- Er zijn geen diensten gepland\n- Wacht tot de pagina volledig geladen is');
            console.error('No shifts found');
            return;
        }

        // Sort by date
        shifts.sort((a, b) => a._sortDate - b._sortDate);
        
        // Remove sort helper
        shifts.forEach(shift => delete shift._sortDate);

        console.log(`\n✅ Successfully extracted ${shifts.length} shifts`);

        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create main worksheet
        const ws = XLSX.utils.json_to_sheet(shifts);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 12 },  // Datum
            { wch: 10 },  // Dag
            { wch: 6 },   // Week
            { wch: 10 },  // Maand
            { wch: 8 },   // Weekend
            { wch: 8 },   // Code
            { wch: 30 },  // Dienst
            { wch: 10 },  // Begintijd
            { wch: 10 },  // Eindtijd
            { wch: 6 },   // Uren
            { wch: 12 }   // Status
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, "Diensten");
        
        // Create summary statistics
        const totalShifts = shifts.length;
        const totalHours = shifts.reduce((sum, shift) => sum + shift['Uren'], 0);
        const selectedShifts = shifts.filter(s => s['Status'] === 'Ingeschreven').length;
        const selectedHours = shifts.filter(s => s['Status'] === 'Ingeschreven')
                                    .reduce((sum, s) => sum + s['Uren'], 0);
        
        // Count by code
        const shiftCounts = {};
        const shiftHours = {};
        const selectedCounts = {};
        const selectedHoursByCode = {};
        
        shifts.forEach(shift => {
            const code = shift['Code'];
            shiftCounts[code] = (shiftCounts[code] || 0) + 1;
            shiftHours[code] = (shiftHours[code] || 0) + shift['Uren'];
            
            if (shift['Status'] === 'Ingeschreven') {
                selectedCounts[code] = (selectedCounts[code] || 0) + 1;
                selectedHoursByCode[code] = (selectedHoursByCode[code] || 0) + shift['Uren'];
            }
        });
        
        // Count by month
        const monthCounts = {};
        const monthHours = {};
        const selectedMonthCounts = {};
        const selectedMonthHours = {};
        
        shifts.forEach(shift => {
            const month = shift['Maand'];
            monthCounts[month] = (monthCounts[month] || 0) + 1;
            monthHours[month] = (monthHours[month] || 0) + shift['Uren'];
            
            if (shift['Status'] === 'Ingeschreven') {
                selectedMonthCounts[month] = (selectedMonthCounts[month] || 0) + 1;
                selectedMonthHours[month] = (selectedMonthHours[month] || 0) + shift['Uren'];
            }
        });
        
        // Create summary data
        const summaryData = [
            { 'Statistiek': 'TOTAAL OVERZICHT', 'Alle diensten': '', 'Ingeschreven': '' },
            { 'Statistiek': 'Aantal diensten', 'Alle diensten': totalShifts, 'Ingeschreven': selectedShifts },
            { 'Statistiek': 'Totaal uren', 'Alle diensten': totalHours.toFixed(2), 'Ingeschreven': selectedHours.toFixed(2) },
            { 'Statistiek': 'Gemiddeld per dienst', 'Alle diensten': (totalHours / totalShifts).toFixed(2), 'Ingeschreven': selectedShifts > 0 ? (selectedHours / selectedShifts).toFixed(2) : '0.00' },
            { 'Statistiek': '', 'Alle diensten': '', 'Ingeschreven': '' },
            { 'Statistiek': 'PER DIENSTCODE', 'Alle diensten': '', 'Ingeschreven': '' }
        ];
        
        Object.keys(shiftCounts).sort().forEach(code => {
            summaryData.push({
                'Statistiek': `${code} - Aantal`,
                'Alle diensten': shiftCounts[code],
                'Ingeschreven': selectedCounts[code] || 0
            });
            summaryData.push({
                'Statistiek': `${code} - Uren`,
                'Alle diensten': shiftHours[code].toFixed(2),
                'Ingeschreven': (selectedHoursByCode[code] || 0).toFixed(2)
            });
        });
        
        summaryData.push({ 'Statistiek': '', 'Alle diensten': '', 'Ingeschreven': '' });
        summaryData.push({ 'Statistiek': 'PER MAAND', 'Alle diensten': '', 'Ingeschreven': '' });
        
        const monthOrder = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                           'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
        monthOrder.forEach(month => {
            if (monthCounts[month]) {
                summaryData.push({
                    'Statistiek': `${month} - Aantal`,
                    'Alle diensten': monthCounts[month],
                    'Ingeschreven': selectedMonthCounts[month] || 0
                });
                summaryData.push({
                    'Statistiek': `${month} - Uren`,
                    'Alle diensten': monthHours[month].toFixed(2),
                    'Ingeschreven': (selectedMonthHours[month] || 0).toFixed(2)
                });
            }
        });
        
        // Create summary worksheet
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Samenvatting");
        
        // Create filtered sheet for selected shifts only
        const selectedShiftsData = shifts.filter(s => s['Status'] === 'Ingeschreven');
        if (selectedShiftsData.length > 0) {
            const wsSelected = XLSX.utils.json_to_sheet(selectedShiftsData);
            wsSelected['!cols'] = ws['!cols'];
            XLSX.utils.book_append_sheet(wb, wsSelected, "Ingeschreven diensten");
        }
        
        // Generate filename
        const firstDate = shifts[0]['Datum'];
        const lastDate = shifts[shifts.length - 1]['Datum'];
        const firstParts = firstDate.split('-');
        const lastParts = lastDate.split('-');
        const filename = `HAP-vrij-roosteren-${firstParts[2]}-${firstParts[1]}-tot-${lastParts[2]}-${lastParts[1]}.xlsx`;
        
        // Write file
        XLSX.writeFile(wb, filename);
        
        console.log(`\n📥 DOWNLOADED: ${filename}`);
        console.log(`\n✅ SUCCESS! ${shifts.length} diensten geëxporteerd naar Excel.`);
        console.log(`   - Totaal beschikbare diensten: ${totalShifts} (${totalHours} uur)`);
        console.log(`   - Ingeschreven diensten: ${selectedShifts} (${selectedHours} uur)`);
        console.log('\n📊 Het bestand bevat tabbladen:');
        console.log('  1. Diensten - Alle diensten met details');
        console.log('  2. Samenvatting - Statistieken (alle + ingeschreven)');
        if (selectedShiftsData.length > 0) {
            console.log('  3. Ingeschreven diensten - Alleen je selecties');
        }
        
        alert(`✅ ${shifts.length} diensten geëxporteerd!\n\n📥 ${filename}\n\n📊 Bevat:\n• Alle beschikbare diensten: ${totalShifts} (${totalHours} uur)\n• Jouw ingeschreven diensten: ${selectedShifts} (${selectedHours} uur)\n• Samenvatting met statistieken\n\n📂 Open met Excel, LibreOffice of Google Spreadsheets.`);
    }

})();
