const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const errorBlock = `          </tbody>
        </table>
        {renderModals()}
      </div>
    </div>
  );
};

function PayrollView({`;

const fixBlock = `          </tbody>
        </table>
      </div>
    </div>
  );
};

function PayrollView({`;

if (code.includes(errorBlock)) {
    code = code.replace(errorBlock, fixBlock);
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log('Fixed renderModals inside renderTaxDetails');
} else {
    console.log('errorBlock not found in ERP.tsx, attempting general replace in 1400-1500 lines');
    const lines = code.split('\\n');
    let found = false;
    for (let i = 1400; i < 1550; i++) {
         if (lines[i] && lines[i].includes('{renderModals()}')) {
             lines.splice(i, 1);
             found = true;
             console.log('Removed {renderModals()} at line', i + 1);
             break;
         }
    }
    if (found) {
        fs.writeFileSync('src/components/ERP.tsx', lines.join('\\n'));
    }
}
