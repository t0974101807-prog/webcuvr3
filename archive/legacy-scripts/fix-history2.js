const fs = require('fs');
let code = fs.readFileSync('src/components/CustomCalendar.tsx', 'utf8');

const targetStrStart = '            {modalMode === "edit" &&\n              history.filter((h) => h.title === selectedEvent?.title).length >\n                0 && (';

const startIndex = code.indexOf(targetStrStart);
if (startIndex !== -1) {
    const targetStrEnd = '                  </div>\n                </div>\n              )}';
    const endIndex = code.indexOf(targetStrEnd, startIndex) + targetStrEnd.length;
    code = code.substring(0, startIndex) + code.substring(endIndex);
    fs.writeFileSync('src/components/CustomCalendar.tsx', code);
    console.log("Removed Lịch sử chỉnh sửa from CustomCalendar.tsx");
} else {
    console.log("Could not find start index");
}
