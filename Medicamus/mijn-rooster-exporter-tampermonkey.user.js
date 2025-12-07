// ==UserScript==
// @name         InterShift "Mijn Rooster" to ICS Exporter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Export your HAP schedule from "Mijn rooster" page to ICS calendar file
// @match        https://medicamus.intershift.nl/SELECT/app/MijnInterShift_MijnRooster.asp*
// @match        https://*/app/MijnIntershift_beschikbaarheid.asp*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Add export button
    function addExportButton() {
        // Find the toolbar area
        const toolbar = document.querySelector('.panel-heading .pull-right');
        
        if (!toolbar) {
            console.log('Toolbar not found, adding floating button');
            addFloatingButton();
            return;
        }

        const btn = document.createElement('a');
        btn.href = '#';
        btn.innerHTML = '<img src="/SELECT/img/icon/calendar.png" alt="Export" title="Export naar agenda (ICS)" />';
        btn.style.marginLeft = '10px';
        btn.onclick = function(e) {
            e.preventDefault();
            extractAndExport();
        };
        
        toolbar.appendChild(btn);
        console.log('Export button added to toolbar');
    }

    // Floating button as fallback
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
            
            if (cells.length < 4) return;
            
            const dateText = cells[1].textContent.trim();
            const timeText = cells[2].textContent.trim();
            const dienstText = cells[3].textContent.trim();
            const uren = cells[4].textContent.trim();
            
            // Parse date
            const dateParts = dateText.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            if (!dateParts) return;
            
            const date = new Date(
                parseInt(dateParts[3]),
                parseInt(dateParts[2]) - 1,
                parseInt(dateParts[1])
            );
            
            // Parse times
            const timeMatch = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
            
            if (!timeMatch) return;
            
            const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            
            const shiftCode = dienstText.split(' ')[0];
            
            shifts.push({
                date: date,
                dateStr: dateText,
                startTime: startTime,
                endTime: endTime,
                code: shiftCode,
                description: dienstText,
                hours: uren
            });
        });

        return shifts;
    }

    // Generate ICS content
    function generateICS(shifts) {
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
        ics += 'X-WR-CALNAME:HAP Diensten\r\n';
        ics += 'X-WR-TIMEZONE:Europe/Amsterdam\r\n';
        
        shifts.forEach((shift, index) => {
            const startDate = parseTime(shift.date, shift.startTime);
            let endDate = parseTime(shift.date, shift.endTime);
            
            if (shift.endTime === '00:00' || shift.endTime === '24:00' || endDate <= startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }
            
            ics += 'BEGIN:VEVENT\r\n';
            ics += `UID:hap-${shift.date.getTime()}-${shift.code}-${index}@harderwijk\r\n`;
            ics += `DTSTAMP:${formatICalDate(new Date())}\r\n`;
            ics += `DTSTART:${formatICalDate(startDate)}\r\n`;
            ics += `DTEND:${formatICalDate(endDate)}\r\n`;
            ics += `SUMMARY:${shift.code} - HAP Dienst\r\n`;
            ics += `DESCRIPTION:${shift.description}\\nUren: ${shift.hours}\r\n`;
            ics += `LOCATION:HAP Harderwijk Medicamus\r\n`;
            ics += 'STATUS:CONFIRMED\r\n';
            ics += 'CATEGORIES:HAP,Dienst,Werk\r\n';
            ics += 'BEGIN:VALARM\r\n';
            ics += 'TRIGGER:-P1DT4H\r\n';
            ics += 'ACTION:DISPLAY\r\n';
            ics += `DESCRIPTION:Morgen HAP dienst: ${shift.code}\r\n`;
            ics += 'END:VALARM\r\n';
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

    // Main export function
    function extractAndExport() {
        const shifts = extractShifts();
        
        if (shifts.length === 0) {
            alert('❌ Geen diensten gevonden.\n\nControleer of je op de "Mijn rooster" pagina bent en er diensten zichtbaar zijn.');
            return;
        }

        shifts.sort((a, b) => a.date - b.date);
        
        const icsContent = generateICS(shifts);
        
        const firstDate = shifts[0].date;
        const lastDate = shifts[shifts.length - 1].date;
        const filename = `HAP-diensten-${firstDate.getFullYear()}-${String(firstDate.getMonth()+1).padStart(2,'0')}-tot-${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}.ics`;
        
        downloadICS(icsContent, filename);
        
        alert(`✅ ${shifts.length} HAP diensten geëxporteerd!\n\n📥 ${filename}\n\n📅 Importeer dit bestand in je agenda app.\n\nℹ️ Diensten bevatten herinneringen 1 dag van tevoren.`);
    }

    // Initialize
    function init() {
        // Wait for page to be ready
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
