const fs = require('fs');
const path = require('path');

const checkPath = path.join(__dirname, 'client', 'node_modules');
if (fs.existsSync(checkPath)) {
    console.log('node_modules exists in client');
} else {
    console.log('node_modules DOES NOT exist in client');
}
