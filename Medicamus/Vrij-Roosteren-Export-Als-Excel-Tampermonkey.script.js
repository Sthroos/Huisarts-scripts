// ==UserScript==
// @name         InterShift "Vrij Roosteren" to Excel Exporter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Export HAP schedule from "Vrij roosteren" to Excel/LibreOffice/Google Sheets
// @match        https://medicamus.intershift.nl/SELECT/app/MijnIntershift_beschikbaarheid.asp*
// @match        https://*/app/MijnInterShift_beschikbaarheid.asp*
// @require      https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('InterShift Vrij Roosteren Excel Exporter loaded');

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

    // Add export button
    function addExportButton() {
        const toolbar = document.querySelector('.divBtns ul.nav-tabs');
        
        if (!toolbar) {
            console.log('Toolbar not found, trying alternative');
            addFloatingButton();
            return;
        }

        const li = document.createElement('li');
        li.style.float = 'right';
        
        const btn = document.createElement('a');
        btn.className = 'btn btn-default';
        btn.innerHTML = '📊 Export naar Excel';
        btn.style.cursor = 'pointer';
        btn.onclick = exportToExcel;
        
        li.appendChild(btn);
        toolbar.appendChild(li);
        
        console.log('Excel export button added');
    }

    function addFloatingButton() {
        const btn = document.createElement('button');
        btn.innerHTML = '📊 Export naar Excel';
        btn.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 10000;
            padding: 12px 20px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        btn.onmouseover = () => btn.style.background = '#218838';
        btn.onmouseout = () => btn.style.background = '#28a745';
        btn.onclick = exportToExcel;
        document.body.appendChild(btn);
    }

    // Extract shifts
    function extractShifts() {
        const container = document.querySelector('#container');
        
        if (!container) {
            console.error('Container not found');
            return [];
        }

        const shifts = [];
        const allCells = container.querySelectorAll('td');

        allCells.forEach(cell => {
            const text = cell.textContent.trim();
            
            if (SHIFT_DEFINITIONS[text]) {
                const cellId = cell.id;
                let date = null;
                
                if (cellId) {
                    const dateMatch = cellId.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
                    if (dateMatch) {
                        date = new Date(
                            parseInt(dateMatch[3]),
                            parseInt(dateMatch[2]) - 1,
                            parseInt(dateMatch[1])
                        );
                    }
                }
                
                if (!date) {
                    const classes = cell.className;
                    const classDateMatch = classes.match(/date(\d{1,2})-(\d{1,2})-(\d{4})/);
                    if (classDateMatch) {
                        date = new Date(
                            parseInt(classDateMatch[3]),
                            parseInt(classDateMatch[2]) - 1,
                            parseInt(classDateMatch[1])
                        );
                    }
                }
                
                if (date) {
                    const shiftInfo = SHIFT_DEFINITIONS[text];
                    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                    
                    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
                    const dayOfWeek = dayNames[date.getDay()];
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6 ? 'Ja' : 'Nee';
                    
                    const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                                       'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
                    const monthName = monthNames[date.getMonth()];
                    
                    function getWeekNumber(d) {
                        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
                        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                        return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
                    }
                    const weekNumber = getWeekNumber(date);
                    
                    const isSelected = cell.classList.contains('btn-success') || 
                                      cell.classList.contains('selected') ||
                                      cell.style.backgroundColor.includes('green');
                    
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
                        'Status': isSelected ? 'Ingeschreven' : 'Beschikbaar',
                        '_sortDate': date
                    });
                }
            }
        });

        shifts.sort((a, b) => a._sortDate - b._sortDate);
        shifts.forEach(shift => delete shift._sortDate);

        return shifts;
    }

    // Generate summary
    function generateSummary(shifts) {
        const totalShifts = shifts.length;
        const totalHours = shifts.reduce((sum, shift) => sum + shift['Uren'], 0);
        const selectedShifts = shifts.filter(s => s['Status'] === 'Ingeschreven').length;
        const selectedHours = shifts.filter(s => s['Status'] === 'Ingeschreven')
                                    .reduce((sum, s) => sum + s['Uren'], 0);
        
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
        
        return { summaryData, totalShifts, totalHours, selectedShifts, selectedHours };
    }

    // Main export function
    function exportToExcel() {
        const shifts = extractShifts();
        
        if (shifts.length === 0) {
            alert('❌ Geen diensten gevonden.\n\nControleer of:\n- Je op de "Vrij roosteren" pagina bent\n- Het rooster volledig geladen is\n- Er diensten zichtbaar zijn');
            return;
        }

        const wb = XLSX.utils.book_new();
        
        // Main worksheet
        const ws = XLSX.utils.json_to_sheet(shifts);
        ws['!cols'] = [
            { wch: 12 }, { wch: 10 }, { wch: 6 }, { wch: 10 }, { wch: 8 },
            { wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 6 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, "Diensten");
        
        // Summary worksheet
        const { summaryData, totalShifts, totalHours, selectedShifts, selectedHours } = generateSummary(shifts);
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Samenvatting");
        
        // Selected shifts worksheet
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
        
        XLSX.writeFile(wb, filename);
        
        alert(`✅ ${shifts.length} diensten geëxporteerd!\n\n📥 ${filename}\n\n📊 Bevat:\n• Alle diensten: ${totalShifts} (${totalHours} uur)\n• Ingeschreven: ${selectedShifts} (${selectedHours} uur)\n• Samenvatting met statistieken\n\n📂 Open met Excel, LibreOffice of Google Spreadsheets.`);
    }

    // Initialize
    function init() {
        const checkSchedule = setInterval(() => {
            const container = document.querySelector('#container table');
            if (container) {
                clearInterval(checkSchedule);
                addExportButton();
            }
        }, 500);

        setTimeout(() => clearInterval(checkSchedule), 10000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
