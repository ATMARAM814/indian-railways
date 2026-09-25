import * as XLSX from 'xlsx';

/**
 * Maps a raw user record to a flat row suitable for Excel export.
 */
const mapUserToRow = (user) => ({
    'HRMS ID': user.hrms_id || '—',
    'Full Name': user.full_name || '—',
    'Designation': user.designation || user.role || '—',
    'Station Code': user.station_code || '—',
    'Station Name': user.station_name || '—',
    'Category': user.category_code ? `Cat ${user.category_code}` : '—',
    'Risk Level': user.risk_level || '—',
    'Latest Score (%)': user.percentage !== null && user.percentage !== undefined
        ? parseFloat(user.percentage).toFixed(1)
        : '—',
    'Status': user.status === 'active' ? 'Active' : 'Inactive',
    'Mobile': user.mobile || '—',
    'Email': user.email || '—',
    'Date of Birth': user.date_of_birth || '—',
    'Date of Joining': user.date_of_joining || '—',
});

/**
 * Auto-sizes columns in a worksheet based on max content width.
 */
const autoFitColumns = (ws, rows) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const colWidths = headers.map((h) => {
        const maxLen = Math.max(
            h.length,
            ...rows.map((r) => String(r[h] || '').length)
        );
        return { wch: Math.min(maxLen + 4, 50) };
    });
    ws['!cols'] = colWidths;
};

/**
 * Applies a basic header style to the first row of a worksheet.
 */
const styleHeaderRow = (ws, numCols) => {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= Math.min(numCols - 1, range.e.c); C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) {
            cell.s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1B365D' } },
                alignment: { horizontal: 'center' },
            };
        }
    }
};

/**
 * Downloads all employees for a given role as a single-sheet Excel file.
 * @param {Function} getWorkforceList - The API function to fetch users
 * @param {string} roleCode - e.g. 'SM', 'PM', 'TI'
 * @param {string} roleTitle - Display name for the role (used in filename)
 * @param {Object} currentFilters - Current active filters
 * @param {Function} onLoadingChange - Callback(bool) to set loading state
 */
export const downloadAllEmployeesExcel = async (
    getWorkforceList,
    roleCode,
    roleTitle,
    currentFilters = {},
    onLoadingChange = null
) => {
    try {
        if (onLoadingChange) onLoadingChange(true);

        // Fetch all records (high limit to get everything)
        const res = await getWorkforceList({
            ...currentFilters,
            role: roleCode,
            page: 1,
            limit: 10000,
        });

        if (!res.success) {
            alert('Failed to fetch employee data for export.');
            return;
        }

        const users = res.data.users || [];
        if (users.length === 0) {
            alert('No employee records found to export.');
            return;
        }

        const rows = users.map(mapUserToRow);
        const ws = XLSX.utils.json_to_sheet(rows);
        autoFitColumns(ws, rows);
        styleHeaderRow(ws, Object.keys(rows[0]).length);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, roleTitle.substring(0, 31));

        const filename = `${roleTitle.replace(/\s+/g, '_')}_All_Employees_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    } catch (err) {
        console.error('Excel export error:', err);
        alert('An error occurred while generating the Excel file.');
    } finally {
        if (onLoadingChange) onLoadingChange(false);
    }
};

/**
 * Downloads all employees for a given role, grouped by station, as a multi-sheet Excel file.
 * @param {Function} getWorkforceList - The API function to fetch users
 * @param {string} roleCode - e.g. 'SM', 'PM', 'TI'
 * @param {string} roleTitle - Display name for the role (used in filename)
 * @param {Object} currentFilters - Current active filters
 * @param {Function} onLoadingChange - Callback(bool) to set loading state
 */
export const downloadStationWiseExcel = async (
    getWorkforceList,
    roleCode,
    roleTitle,
    currentFilters = {},
    onLoadingChange = null
) => {
    try {
        if (onLoadingChange) onLoadingChange(true);

        const res = await getWorkforceList({
            ...currentFilters,
            role: roleCode,
            page: 1,
            limit: 10000,
        });

        if (!res.success) {
            alert('Failed to fetch employee data for export.');
            return;
        }

        const users = res.data.users || [];
        if (users.length === 0) {
            alert('No employee records found to export.');
            return;
        }

        // Group by station
        const stationMap = {};
        users.forEach((user) => {
            const stationKey = user.station_name
                ? `${user.station_code || 'UNK'} - ${user.station_name}`
                : 'Unassigned';
            if (!stationMap[stationKey]) stationMap[stationKey] = [];
            stationMap[stationKey].push(user);
        });

        const wb = XLSX.utils.book_new();

        // Add a summary sheet first
        const summaryRows = Object.entries(stationMap).map(([station, stUsers]) => ({
            'Station': station,
            'Total Employees': stUsers.length,
            'Active': stUsers.filter((u) => u.status === 'active').length,
            'Inactive': stUsers.filter((u) => u.status !== 'active').length,
            'Cat A': stUsers.filter((u) => u.category_code === 'A').length,
            'Cat B': stUsers.filter((u) => u.category_code === 'B').length,
            'Cat C': stUsers.filter((u) => u.category_code === 'C').length,
            'Cat D': stUsers.filter((u) => u.category_code === 'D').length,
        }));
        const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
        autoFitColumns(summaryWs, summaryRows);
        styleHeaderRow(summaryWs, Object.keys(summaryRows[0]).length);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // Add one sheet per station (max 31 chars for sheet name)
        Object.entries(stationMap).forEach(([stationLabel, stUsers]) => {
            const sheetName = stationLabel.substring(0, 31);
            const rows = stUsers.map(mapUserToRow);
            const ws = XLSX.utils.json_to_sheet(rows);
            autoFitColumns(ws, rows);
            styleHeaderRow(ws, Object.keys(rows[0]).length);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const filename = `${roleTitle.replace(/\s+/g, '_')}_Station_Wise_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    } catch (err) {
        console.error('Excel export error:', err);
        alert('An error occurred while generating the Excel file.');
    } finally {
        if (onLoadingChange) onLoadingChange(false);
    }
};

/**
 * Downloads the station list as an Excel file.
 * @param {Array} stations - Array of station objects
 * @param {string} filename - Name for the exported file
 */
export const downloadStationsExcel = (stations, filename = 'Stations_List.xlsx') => {
    if (!stations || stations.length === 0) {
        alert('No station data available to export.');
        return;
    }

    const rows = stations.map((s) => ({
        'Station Name': s.stationName || '—',
        'Station Code': s.stationCode || '—',
        'Assigned TI': s.assignedTI || 'Unassigned',
        'Total Staff': s.totalStaff || 0,
        'Safety Compliance (%)': s.safetyCompliance ? `${Number(s.safetyCompliance)}%` : '0%',
        'Pending Assessments': s.pendingAssessments || 0,
        'Division': s.divisionName || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    autoFitColumns(ws, rows);
    styleHeaderRow(ws, Object.keys(rows[0]).length);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stations');

    XLSX.writeFile(wb, filename);
};

/**
 * Downloads employees grouped station-wise from a list of stations.
 * Each station's employees are fetched individually and put in separate sheets.
 * @param {Array} stations - Array of station objects with stationId and stationName
 * @param {Function} getWorkforceList - API function to fetch employees with stationId filter
 * @param {Function} onLoadingChange - Callback(bool) to set loading state
 */
export const downloadAllStationsEmployeesExcel = async (
    stations,
    getWorkforceList,
    onLoadingChange = null
) => {
    try {
        if (onLoadingChange) onLoadingChange(true);

        // Fetch ALL employees across all stations (no role filter)
        const res = await getWorkforceList({ page: 1, limit: 10000 });

        if (!res.success) {
            alert('Failed to fetch employee data for export.');
            return;
        }

        const allUsers = res.data.users || [];
        if (allUsers.length === 0) {
            alert('No employee records found to export.');
            return;
        }

        // Build station name lookup from the stations array
        const stationLookup = {};
        (stations || []).forEach((s) => {
            stationLookup[s.stationId] = s.stationName || s.stationCode || String(s.stationId);
        });

        // Group by station
        const stationMap = {};
        allUsers.forEach((user) => {
            const stKey = user.station_name
                ? `${user.station_code || 'UNK'} - ${user.station_name}`
                : 'Unassigned';
            if (!stationMap[stKey]) stationMap[stKey] = [];
            stationMap[stKey].push(user);
        });

        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryRows = Object.entries(stationMap).map(([station, stUsers]) => ({
            'Station': station,
            'Total Employees': stUsers.length,
            'Active': stUsers.filter((u) => u.status === 'active').length,
            'Inactive': stUsers.filter((u) => u.status !== 'active').length,
            'Cat A': stUsers.filter((u) => u.category_code === 'A').length,
            'Cat B': stUsers.filter((u) => u.category_code === 'B').length,
            'Cat C': stUsers.filter((u) => u.category_code === 'C').length,
            'Cat D': stUsers.filter((u) => u.category_code === 'D').length,
            'High Risk': stUsers.filter((u) => u.risk_level === 'HIGH').length,
            'Medium Risk': stUsers.filter((u) => u.risk_level === 'MEDIUM').length,
            'Low Risk': stUsers.filter((u) => u.risk_level === 'LOW').length,
        }));

        const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
        autoFitColumns(summaryWs, summaryRows);
        styleHeaderRow(summaryWs, Object.keys(summaryRows[0]).length);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // Per-station sheets
        Object.entries(stationMap).forEach(([stationLabel, stUsers]) => {
            const sheetName = stationLabel.substring(0, 31);
            const rows = stUsers.map(mapUserToRow);
            const ws = XLSX.utils.json_to_sheet(rows);
            autoFitColumns(ws, rows);
            styleHeaderRow(ws, Object.keys(rows[0]).length);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const filename = `Station_Wise_All_Employees_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    } catch (err) {
        console.error('Excel export error:', err);
        alert('An error occurred while generating the Excel file.');
    } finally {
        if (onLoadingChange) onLoadingChange(false);
    }
};
