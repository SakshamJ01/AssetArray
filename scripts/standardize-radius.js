const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/theme/appStyles.ts');
let code = fs.readFileSync(targetFile, 'utf-8');

// Replace card/panel radius: 28 -> 12, 20/22/18/16 -> 8
code = code.replace(/(authCard:\s*\{[^}]+borderRadius:\s*)28/g, '$112');
code = code.replace(/(heroCard:\s*\{[^}]+borderRadius:\s*)28/g, '$112');
code = code.replace(/(bottomTabBar:\s*\{[^}]+borderRadius:\s*)18/g, '$112');
code = code.replace(/(modalCardCenter:\s*\{[^}]+borderRadius:\s*)20/g, '$112');
code = code.replace(/(modalSecondary:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(pageHeader:\s*\{[^}]+borderRadius:\s*)16/g, '$18');

code = code.replace(/(statCard:\s*\{[^}]+borderRadius:\s*)22/g, '$18');
code = code.replace(/(miniStat:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(panel:\s*\{[^}]+borderRadius:\s*)20/g, '$18');
code = code.replace(/(broadcastStrip:\s*\{[^}]+borderRadius:\s*)18/g, '$18');
code = code.replace(/(emptyState:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(clientRow:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(aiResearchResult:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(historyItem:\s*\{[^}]+borderRadius:\s*)14/g, '$16');
code = code.replace(/(reportBlock:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(categoryCard:\s*\{[^}]+borderRadius:\s*)18/g, '$18');
code = code.replace(/(analyticsMetricCard:\s*\{[^}]+borderRadius:\s*)18/g, '$18');
code = code.replace(/(allocationRow:\s*\{[^}]+borderRadius:\s*)16/g, '$16');
code = code.replace(/(analyticsAlert:\s*\{[^}]+borderRadius:\s*)14/g, '$16');
code = code.replace(/(analyticsListCard:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(holdingCard:\s*\{[^}]+borderRadius:\s*)18/g, '$18');
code = code.replace(/(settingsStatusItem:\s*\{[^}]+borderRadius:\s*)14/g, '$16');

code = code.replace(/(authInput:\s*\{[^}]+borderRadius:\s*)16/g, '$18');
code = code.replace(/(input:\s*\{[^}]+borderRadius:\s*)14/g, '$16');
code = code.replace(/(selectorPill:\s*\{[^}]+borderRadius:\s*)14/g, '$16');

code = code.replace(/(primaryButton:\s*\{[^}]+borderRadius:\s*)14/g, '$18');
code = code.replace(/(goldButton:\s*\{[^}]+borderRadius:\s*)14/g, '$18');
code = code.replace(/(secondaryButton:\s*\{[^}]+borderRadius:\s*)14/g, '$18');

code = code.replace(/(clientListAvatar:\s*\{[^}]+borderRadius:\s*)19/g, '$1999');
code = code.replace(/(clientListAvatarPlaceholder:\s*\{[^}]+borderRadius:\s*)19/g, '$1999');
code = code.replace(/(clientDetailAvatar:\s*\{[^}]+borderRadius:\s*)26/g, '$1999');
code = code.replace(/(clientDetailAvatarPlaceholder:\s*\{[^}]+borderRadius:\s*)26/g, '$1999');

fs.writeFileSync(targetFile, code);
console.log('Successfully standardized appStyles.ts radius tokens to canonical tokens [0, 4, 6, 8, 12, 999]');
