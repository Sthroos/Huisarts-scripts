// INTERSHIFT "MIJN ROOSTER" TO EXCEL/SPREADSHEET EXPORTER
// Copy and paste this into browser console (F12) on the "Mijn rooster" page
// Exports to XLSX format (Excel, LibreOffice Calc, Google Sheets compatible)

(function() {
    console.log('=== InterShift "Mijn Rooster" to Excel Exporter ===');
    
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
            
            if (cells.length < 7) return; // Skip invalid rows
            
            // Extract data from cells
            const dateText = cells[1].textContent.trim();
            const timeText = cells[2].textContent.trim();
            const dienstText = cells[3].textContent.trim();
            const uren = cells[4].textContent.trim();
            const urenHerregistratie = cells[5].textContent.trim();
            const vastgesteld = cells[6].textContent.trim();
            const ruiling = cells[7] ? cells[7].textContent.trim() : '';
            
            // Parse date (format: DD-MM-YYYY)
            const dateParts = dateText.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            if (!dateParts) {
                console.warn(`Could not parse date: ${dateText}`);
                return;
            }
            
            const day = parseInt(dateParts[1]);
            const month = parseInt(dateParts[2]);
            const year = parseInt(dateParts[3]);
            
            // Create proper Excel date (Excel dates are days since 1900-01-01)
            const excelDate = new Date(year, month - 1, day);
            
            // Parse times
            const timeMatch = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
            
            let startTime = '';
            let endTime = '';
            if (timeMatch) {
                startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
                endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            }
            
            // Extract shift code and name
            const shiftCode = dienstText.split(' ')[0];
            const shiftName = dienstText.substring(shiftCode.length).trim();
            
            // Parse hours (convert "7,00" to 7.0)
            const hoursNum = parseFloat(uren.replace(',', '.')) || 0;
            const hoursHerregNum = parseFloat(urenHerregistratie.replace(',', '.')) || 0;
            
            // Determine day of week (in Dutch)
            const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
            const dayOfWeek = dayNames[excelDate.getDay()];
            
            // Determine if weekend
            const isWeekend = excelDate.getDay() === 0 || excelDate.getDay() === 6 ? 'Ja' : 'Nee';
            
            // Month name
            const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                               'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
            const monthName = monthNames[month - 1];
            
            // Week number (ISO 8601)
            function getWeekNumber(d) {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
                return weekNo;
            }
            const weekNumber = getWeekNumber(excelDate);
            
            shifts.push({
                'Datum': dateText,
                'Dag': dayOfWeek,
                'Week': weekNumber,
                'Maand': monthName,
                'Weekend': isWeekend,
                'Begintijd': startTime,
                'Eindtijd': endTime,
                'Code': shiftCode,
                'Dienst': shiftName,
                'Volledige omschrijving': dienstText,
                'Uren': hoursNum,
                'Uren herregistratie': hoursHerregNum,
                'Vastgesteld': vastgesteld,
                'Ruiling': ruiling
            });
            
            console.log(`✓ Parsed: ${dateText} ${shiftCode}`);
        });

        if (shifts.length === 0) {
            alert('❌ Geen diensten gevonden om te exporteren.');
            console.error('No shifts were parsed successfully');
            return;
        }

        console.log(`\n✅ Successfully parsed ${shifts.length} shifts`);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create main worksheet from shifts data
        const ws = XLSX.utils.json_to_sheet(shifts);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 12 },  // Datum
            { wch: 10 },  // Dag
            { wch: 6 },   // Week
            { wch: 10 },  // Maand
            { wch: 8 },   // Weekend
            { wch: 10 },  // Begintijd
            { wch: 10 },  // Eindtijd
            { wch: 8 },   // Code
            { wch: 25 },  // Dienst
            { wch: 35 },  // Volledige omschrijving
            { wch: 8 },   // Uren
            { wch: 12 },  // Uren herregistratie
            { wch: 10 },  // Vastgesteld
            { wch: 15 }   // Ruiling
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Diensten");
        
        // Create summary sheet
        const totalHours = shifts.reduce((sum, shift) => sum + shift['Uren'], 0);
        const totalHoursHerreg = shifts.reduce((sum, shift) => sum + shift['Uren herregistratie'], 0);
        
        // Count shifts by code
        const shiftCounts = {};
        const shiftHours = {};
        shifts.forEach(shift => {
            const code = shift['Code'];
            shiftCounts[code] = (shiftCounts[code] || 0) + 1;
            shiftHours[code] = (shiftHours[code] || 0) + shift['Uren'];
        });
        
        // Count shifts by month
        const monthCounts = {};
        const monthHours = {};
        shifts.forEach(shift => {
            const month = shift['Maand'];
            monthCounts[month] = (monthCounts[month] || 0) + 1;
            monthHours[month] = (monthHours[month] || 0) + shift['Uren'];
        });
        
        // Create summary data
        const summaryData = [
            { 'Statistiek': 'TOTAAL OVERZICHT', 'Waarde': '' },
            { 'Statistiek': 'Totaal aantal diensten', 'Waarde': shifts.length },
            { 'Statistiek': 'Totaal aantal uren', 'Waarde': totalHours.toFixed(2) },
            { 'Statistiek': 'Totaal uren herregistratie', 'Waarde': totalHoursHerreg.toFixed(2) },
            { 'Statistiek': 'Gemiddeld uren per dienst', 'Waarde': (totalHours / shifts.length).toFixed(2) },
            { 'Statistiek': '', 'Waarde': '' },
            { 'Statistiek': 'PER DIENSTCODE', 'Waarde': '' }
        ];
        
        // Add shift code statistics
        Object.keys(shiftCounts).sort().forEach(code => {
            summaryData.push({
                'Statistiek': `${code} - Aantal diensten`,
                'Waarde': shiftCounts[code]
            });
            summaryData.push({
                'Statistiek': `${code} - Totaal uren`,
                'Waarde': shiftHours[code].toFixed(2)
            });
        });
        
        summaryData.push({ 'Statistiek': '', 'Waarde': '' });
        summaryData.push({ 'Statistiek': 'PER MAAND', 'Waarde': '' });
        
        // Add month statistics
        const monthOrder = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                           'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
        monthOrder.forEach(month => {
            if (monthCounts[month]) {
                summaryData.push({
                    'Statistiek': `${month} - Aantal diensten`,
                    'Waarde': monthCounts[month]
                });
                summaryData.push({
                    'Statistiek': `${month} - Totaal uren`,
                    'Waarde': monthHours[month].toFixed(2)
                });
            }
        });
        
        // Create summary worksheet
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Samenvatting");
        
        // Get date range for filename
        const firstDate = shifts[0]['Datum'];
        const lastDate = shifts[shifts.length - 1]['Datum'];
        const firstDateParts = firstDate.split('-');
        const lastDateParts = lastDate.split('-');
        
        // Generate filename
        const filename = `HAP-diensten-${firstDateParts[2]}-${firstDateParts[1]}-tot-${lastDateParts[2]}-${lastDateParts[1]}.xlsx`;
        
        // Write file
        XLSX.writeFile(wb, filename);
        
        console.log(`\n📥 DOWNLOADED: ${filename}`);
        console.log(`\n✅ SUCCESS! ${shifts.length} diensten geëxporteerd naar Excel.`);
        console.log('\n📊 Het bestand bevat 2 tabbladen:');
        console.log('  1. Diensten - Alle diensten met details');
        console.log('  2. Samenvatting - Statistieken en totalen');
        console.log('\n📂 Open met:');
        console.log('  • Microsoft Excel');
        console.log('  • LibreOffice Calc');
        console.log('  • Google Spreadsheets (Bestand → Importeren)');
        console.log('  • Numbers (Mac)');
        
        alert(`✅ ${shifts.length} HAP diensten geëxporteerd!\n\n📥 Bestand: ${filename}\n\n📊 Het bestand bevat:\n• Alle diensten met details\n• Samenvattingsblad met statistieken\n• Totaal ${totalHours.toFixed(1)} uur\n\n📂 Open met Excel, LibreOffice of Google Spreadsheets.`);
    }

})();
