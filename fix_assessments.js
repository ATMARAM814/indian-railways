const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'modules', 'assessments', 'assessment.repository.js');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the NOT EXISTS blocks in SM conditions (occurs 3 times: stats, eligible, bulk)
const smNotExistsRegex = /AND NOT EXISTS \([\s\S]*?Station Master Supervisio'\s*\)/g;
content = content.replace(smNotExistsRegex, '');

const smNotExistsPushRegex = /conditions\.push\(`\s*NOT EXISTS \([\s\S]*?Station Master Supervisio'\s*\)\s*`\);/g;
content = content.replace(smNotExistsPushRegex, '');

// Replace the TI NOT EXISTS block (occurs 3 times: stats, eligible, bulk)
const tiNotExistsRegex = /\$\{roleCode !== 'TM' \? `AND NOT EXISTS \([\s\S]*?Station Master Supervisio'\s*\)` : ''\}/g;
content = content.replace(tiNotExistsRegex, '');

const tiNotExistsPushRegex = /if \(roleCode !== 'TM'\) \{\s*conditions\.push\(`\s*NOT EXISTS \([\s\S]*?Station Master Supervisio'\s*\)\s*`\);\s*\}/g;
content = content.replace(tiNotExistsPushRegex, '');

// Replace the "p.reporting_officer_id IS NULL" blocks in conditions.push (occurs in TI, AOM, else)
const reportingOfficerRegex = /conditions\.push\(`\s*p\.reporting_officer_id IS NULL\s*`\);/g;
content = content.replace(reportingOfficerRegex, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed assessment repository');
