let db = null;
export async function getDatabase() {
    if (db) {
        return db;
    }
    // Create simple in-memory database
    db = {
        tables: new Map(),
        save: () => {
            // Save to localStorage in browser environment
            try {
                const data = {};
                for (const [table, records] of db.tables.entries()) {
                    data[table] = records;
                }
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('tableflo_db', JSON.stringify(data));
                }
            }
            catch (error) {
                console.log('Could not save to localStorage');
            }
        }
    };
    // Load existing data from localStorage
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = window.localStorage.getItem('tableflo_db');
            if (stored) {
                const data = JSON.parse(stored);
                for (const [table, records] of Object.entries(data)) {
                    db.tables.set(table, records);
                }
            }
        }
    }
    catch (error) {
        console.log('Could not load from localStorage');
    }
    // Initialize tables
    if (!db.tables.has('Employees'))
        db.tables.set('Employees', []);
    if (!db.tables.has('Dealers'))
        db.tables.set('Dealers', []);
    if (!db.tables.has('Tables'))
        db.tables.set('Tables', []);
    if (!db.tables.has('Assignments'))
        db.tables.set('Assignments', []);
    if (!db.tables.has('DealerCertifications'))
        db.tables.set('DealerCertifications', []);
    if (!db.tables.has('BreakRecords'))
        db.tables.set('BreakRecords', []);
    if (!db.tables.has('AuditLogs'))
        db.tables.set('AuditLogs', []);
    return db;
}
export function saveDatabase() {
    if (!db)
        return;
    try {
        const data = {};
        for (const [table, records] of db.tables.entries()) {
            data[table] = records;
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('tableflo_db', JSON.stringify(data));
        }
    }
    catch (error) {
        console.log('Could not save to localStorage');
    }
}
export function closeDatabase() {
    if (db) {
        saveDatabase();
        db = null;
    }
}
