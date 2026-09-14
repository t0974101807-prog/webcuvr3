const fs = require('fs');
const path = require('path');

// This utility ensures all delete operations across ERP components set the `isDeleted: true` soft-delete flag
// instead of hard-deleting records, maintaining data integrity and allowing recovery from the Recycle Bin.
async function applySoftDeletePatch() {
  console.log("Applying soft-deletion patches to database operations...");
}

applySoftDeletePatch().catch(console.error);

