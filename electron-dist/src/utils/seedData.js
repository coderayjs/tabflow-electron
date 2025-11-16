import { getDatabase, saveDatabase } from './database.js';
import { AuthenticationService } from '../services/AuthenticationService.js';
export async function seedDatabase() {
    const db = await getDatabase();
    const authService = new AuthenticationService();
    // Dealer images array
    const dealerImages = [
        '/images/dealers/download.jpeg',
        '/images/dealers/download (2).jpeg',
        '/images/dealers/images (1).jpeg',
        '/images/dealers/images (2).jpeg',
        '/images/dealers/images (3).jpeg',
        '/images/dealers/images (5).jpeg',
        '/images/dealers/images (6).jpeg',
        '/images/dealers/istockphoto-1355051102-612x612.jpg',
        '/images/dealers/Marianela Collado - Headshot.jpg',
        '/images/dealers/portrait-surprised-man-forty-years_209484-974.avif',
    ];
    // Check if admin exists
    const employees = db.tables.get('Employees') || [];
    const adminExists = employees.some((emp) => emp.employeeNumber === 'ADMIN001');
    // Update existing dealers with images if they don't have them
    if (adminExists) {
        const dealersTable = db.tables.get('Dealers') || [];
        let updated = false;
        dealersTable.forEach((dealer, index) => {
            if (!dealer.profileImage) {
                dealer.profileImage = dealerImages[index % dealerImages.length];
                updated = true;
            }
        });
        if (updated) {
            saveDatabase();
            console.log('Updated existing dealers with profile images');
        }
        return;
    }
    console.log('Seeding database...');
    // Create admin user
    await authService.registerEmployee('ADMIN001', 'Admin', 'User', 'admin123', 'Admin');
    // Create sample supervisor
    await authService.registerEmployee('SUPER001', 'John', 'Supervisor', 'super123', 'Supervisor');
    const dealers = [
        { number: 'DEAL001', firstName: 'Sarah', lastName: 'Martinez', role: 'Dealer' },
        { number: 'DEAL002', firstName: 'Michael', lastName: 'Chen', role: 'Dealer' },
        { number: 'DEAL003', firstName: 'Jessica', lastName: 'Thompson', role: 'Dealer' },
        { number: 'DEAL004', firstName: 'David', lastName: 'Rodriguez', role: 'Dealer' },
        { number: 'DEAL005', firstName: 'Emily', lastName: 'Johnson', role: 'Dealer' },
        { number: 'DEAL006', firstName: 'James', lastName: 'Williams', role: 'Dealer' },
        { number: 'DEAL007', firstName: 'Maria', lastName: 'Garcia', role: 'Dealer' },
        { number: 'DEAL008', firstName: 'Robert', lastName: 'Brown', role: 'Dealer' },
    ];
    for (let i = 0; i < dealers.length; i++) {
        const dealer = dealers[i];
        const employee = await authService.registerEmployee(dealer.number, dealer.firstName, dealer.lastName, 'dealer123', dealer.role);
        // Create dealer record with profile image
        const dealersTable = db.tables.get('Dealers') || [];
        dealersTable.push({
            id: dealersTable.length + 1,
            employeeId: employee.id,
            status: 'Available',
            seniorityLevel: Math.floor(Math.random() * 10) + 1,
            shiftStart: '08:00:00',
            shiftEnd: '16:00:00',
            lastBreakTime: null,
            lastMealTime: null,
            preferredPit: null,
            profileImage: dealerImages[i % dealerImages.length], // Cycle through available images
            certifications: [],
            assignmentHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    // Create sample tables
    const tables = db.tables.get('Tables') || [];
    const sampleTables = [
        { number: 'BJ-101', gameType: 'Blackjack', pit: 'Main Floor', minBet: 10, maxBet: 500, status: 'Open' },
        { number: 'BJ-102', gameType: 'Blackjack', pit: 'Main Floor', minBet: 25, maxBet: 1000, status: 'Open' },
        { number: 'BJ-103', gameType: 'Blackjack', pit: 'High Limit', minBet: 100, maxBet: 5000, status: 'Open' },
        { number: 'R-201', gameType: 'Roulette', pit: 'Main Floor', minBet: 5, maxBet: 1000, status: 'Open' },
        { number: 'R-202', gameType: 'Roulette', pit: 'Main Floor', minBet: 10, maxBet: 2000, status: 'Closed' },
        { number: 'CR-301', gameType: 'Craps', pit: 'Center Pit', minBet: 10, maxBet: 2000, requiredCount: 3, status: 'Open' },
        { number: 'BAC-401', gameType: 'Baccarat', pit: 'High Limit', minBet: 100, maxBet: 10000, status: 'Open' },
        { number: 'PG-501', gameType: 'PaiGow', pit: 'Asian Games', minBet: 15, maxBet: 1500, status: 'Closed' },
    ];
    const now = new Date().toISOString();
    for (const table of sampleTables) {
        const newTable = {
            id: tables.length + 1,
            tableNumber: table.number,
            gameType: table.gameType,
            status: table.status,
            minBet: table.minBet,
            maxBet: table.maxBet,
            isHighLimit: table.minBet >= 100,
            pit: table.pit,
            requiredDealerCount: table.requiredCount || 1,
            requiredCrapsRoles: [],
            pushIntervalMinutes: 20,
            isLocked: false,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            currentAssignments: [],
            nextAssignments: []
        };
        tables.push(newTable);
    }
    saveDatabase();
    console.log('Database seeded successfully');
}
