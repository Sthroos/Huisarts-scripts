// ==UserScript==
// @name         InterShift "Mijn Rooster" to Excel Exporter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Export HAP schedule from "Mijn rooster" to Excel/LibreOffice/Google Sheets
// @match        https://medicamus.intershift.nl/SELECT/app/MijnInterShift_MijnRooster.asp*
// @match        https://*/app/MijnIntershift_MijnRooster.asp*
// @require      https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('InterShift Excel Exporter loaded');

    // Add Excel export button
    function addExportButton() {
        const toolbar = document.querySelector('.panel-heading .pull-right');
        
        if (!toolbar) {
            console.log('Toolbar not found');
            return;
        }

        // Add Excel button
        const excelBtn = document.createElement('a');
        excelBtn.href = '#';
        excelBtn.innerHTML = '<img src="/SELECT/img/icon/Excel.png" alt="Export Excel" title="Export naar Excel/Spreadsheet" />';
        excelBtn.style.marginLeft = '10px';
        excelBtn.onclick = function(e) {
            e.preventDefault();
            exportToExcel();
        };
        
        // Insert before the existing Excel button
        const existingExcelLink = toolbar.querySelector('a[href*="toExcel"]');
        if (existingExcelLink) {
            toolbar.insertBefore(excelBtn, existingExcelLink);
            // Add a separator text
            const separator = document.createElement('span');
            separator.textContent = ' | ';
            separator.style.color = '#ccc';
            toolbar.insertBefore(separator, existingExcelLink);
        } else {
            toolbar.appendChild(excelBtn);
        }
        
        console.log('Excel export button added');
    }

    // Extract shifts from table
    function extractShifts() {
        const table = document.querySelector('#listDiensten');
        
        if (!table) {
            console.error('Table not found');
            return [];
        }

        const shifts = [];
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            
            if (cells.length < 7) return;
            
            const dateText = cells[1].textContent.trim();
            const timeText = cells[2].textContent.trim();
            const dienstText = cells[3].textContent.trim();
            const uren = cells[4].textContent.trim();
            const urenHerregistratie = cells[5].textContent.trim();
            const vastgesteld = cells[6].textContent.trim();
            const ruiling = cells[7] ? cells[7].textContent.trim() : '';
            
            // Parse date
            const dateParts = dateText.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            if (!dateParts) return;
            
            const day = parseInt(dateParts[1]);
            const month = parseInt(dateParts[2]);
            const year = parseInt(dateParts[3]);
            const excelDate = new Date(year, month - 1, day);
            
            // Parse times
            const timeMatch = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
            let startTime = '', endTime = '';
            if (timeMatch) {
                startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
                endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            }
            
            const shiftCode = dienstText.split(' ')[0];
            const shiftName = dienstText.substring(shiftCode.length).trim();
            
            const hoursNum = parseFloat(uren.replace(',', '.')) || 0;
            const hoursHerregNum = parseFloat(urenHerregistratie.replace(',', '.')) || 0;
            
            const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
            const dayOfWeek = dayNames[excelDate.getDay()];
            const isWeekend = excelDate.getDay() === 0 || excelDate.getDay() === 6 ? 'Ja' : 'Nee';
            
            const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                               'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
            const monthName = monthNames[month - 1];
            
            function getWeekNumber(d) {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
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
        });

        return shifts;
    }

    // Generate summary statistics
    function generateSummary(shifts) {
        const totalHours = shifts.reduce((sum, shift) => sum + shift['Uren'], 0);
        const totalHoursHerreg = shifts.reduce((sum, shift) => sum + shift['Uren herregistratie'], 0);
        
        const shiftCounts = {};
        const shiftHours = {};
        shifts.forEach(shift => {
            const code = shift['Code'];
            shiftCounts[code] = (shiftCounts[code] || 0) + 1;
            shiftHours[code] = (shiftHours[code] || 0) + shift['Uren'];
        });
        
        const monthCounts = {};
        const monthHours = {};
        shifts.forEach(shift => {
            const month = shift['Maand'];
            monthCounts[month] = (monthCounts[month] || 0) + 1;
            monthHours[month] = (monthHours[month] || 0) + shift['Uren'];
        });
        
        const summaryData = [
            { 'Statistiek': 'TOTAAL OVERZICHT', 'Waarde': '' },
            { 'Statistiek': 'Totaal aantal diensten', 'Waarde': shifts.length },
            { 'Statistiek': 'Totaal aantal uren', 'Waarde': totalHours.toFixed(2) },
            { 'Statistiek': 'Totaal uren herregistratie', 'Waarde': totalHoursHerreg.toFixed(2) },
            { 'Statistiek': 'Gemiddeld uren per dienst', 'Waarde': (totalHours / shifts.length).toFixed(2) },
            { 'Statistiek': '', 'Waarde': '' },
            { 'Statistiek': 'PER DIENSTCODE', 'Waarde': '' }
        ];
        
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
        
        return { summaryData, totalHours };
    }

    // Main export function
    function exportToExcel() {
        const shifts = extractShifts();
        
        if (shifts.length === 0) {
            alert('❌ Geen diensten gevonden.\n\nControleer of je op de "Mijn rooster" pagina bent en er diensten zichtbaar zijn.');
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create main worksheet
        const ws = XLSX.utils.json_to_sheet(shifts);
        ws['!cols'] = [
            { wch: 12 }, { wch: 10 }, { wch: 6 }, { wch: 10 }, { wch: 8 },
            { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 25 }, { wch: 35 },
            { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, "Diensten");
        
        // Create summary worksheet
        const { summaryData, totalHours } = generateSummary(shifts);
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Samenvatting");
        
        // Generate filename
        const firstDate = shifts[0]['Datum'];
        const lastDate = shifts[shifts.length - 1]['Datum'];
        const firstParts = firstDate.split('-');
        const lastParts = lastDate.split('-');
        const filename = `HAP-diensten-${firstParts[2]}-${firstParts[1]}-tot-${lastParts[2]}-${lastParts[1]}.xlsx`;
        
        // Write file
        XLSX.writeFile(wb, filename);
        
        alert(`✅ ${shifts.length} HAP diensten geëxporteerd!\n\n📥 ${filename}\n\n📊 Bevat:\n• Alle diensten met details\n• Samenvatting met statistieken\n• Totaal ${totalHours.toFixed(1)} uur\n\n📂 Open met Excel, LibreOffice of Google Spreadsheets.`);
    }

    // Initialize
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(addExportButton, 500);
            });
        } else {
            setTimeout(addExportButton, 500);
        }
    }

    init();

})();
