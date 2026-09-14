const fs = require('fs');

const file = 'src/components/ERP.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the first PermissionsView
const firstPermissionsView = content.indexOf('function PermissionsView({ language }: { language: \'vi\' | \'en\' }) {');

// Find the second PermissionsView
const secondPermissionsView = content.indexOf('function PermissionsView({ language }: { language: \'vi\' | \'en\' }) {', firstPermissionsView + 1);

if (firstPermissionsView !== -1 && secondPermissionsView !== -1) {
  // Find the first NotificationsView
  const firstNotificationsView = content.indexOf('function NotificationsView({ language }: { language: \'vi\' | \'en\' }) {');
  
  // The duplication happened because we inserted newNotificationsView at firstNotificationsView,
  // and then appended everything from firstPermissionsView.
  // So the content from firstNotificationsView to the end of the newNotificationsView is what we want to keep,
  // but we need to remove the duplicated chunk that starts at secondPermissionsView.
  // Wait, the original file had:
  // ...
  // function PermissionsView
  // ...
  // function NotificationsView
  // ...
  // function SettingsView
  // ...
  
  // Let's just restore the file from before the script if possible. Is there a backup? No.
  // Let's manually reconstruct it.
  
  // The original file had PermissionsView before NotificationsView.
  // We replaced from 0 to firstNotificationsView with itself.
  // Then we added newNotificationsView.
  // Then we added content from firstPermissionsView to the end.
  // This means from firstNotificationsView to the end of newNotificationsView is correct.
  // But after newNotificationsView, we have the duplicated firstPermissionsView and everything after it.
  // We should just remove the duplicated part and replace it with what was originally after NotificationsView.
  
  // Let's find what was originally after NotificationsView.
  // It was probably function SettingsView or something.
  // Let's check the duplicated part.
}
