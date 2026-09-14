const Database = require('better-sqlite3');
const db = new Database('lawfirm.db');

const initialPermissions = {
      admin: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
      director: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
      deputyDirector: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
      head_of_department: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
      manager: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
      prosecutor: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 1, viewEventHistory: 1 },
      lawyer: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 1, viewEventHistory: 1 },
      specialist: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
      accountant: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 1, viewPersonalRecords: 0, editPersonalRecords: 0, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
      editor: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 1, manageFinance: 0, viewPersonalRecords: 0, editPersonalRecords: 0, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
      traineeLawyer: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
      intern: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 }
};

const insertPerm = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role, manageUsers, viewAllRecords, editAllRecords, deleteRecords, viewReports, manageWeb, manageFinance, viewPersonalRecords, editPersonalRecords, manageEvents, manageLegalDocs, viewEventHistory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const [role, perms] of Object.entries(initialPermissions)) {
    insertPerm.run(role, perms.manageUsers, perms.viewAllRecords, perms.editAllRecords, perms.deleteRecords, perms.viewReports, perms.manageWeb, perms.manageFinance, perms.viewPersonalRecords, perms.editPersonalRecords, perms.manageEvents, perms.manageLegalDocs, perms.viewEventHistory);
}

console.log("Seeded missing permissions");
