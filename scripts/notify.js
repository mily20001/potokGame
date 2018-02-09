'use strict';
const notifier = require('node-notifier');

let title = 'Better Facebook Messenger';
let message = '';

if (process.argv.length === 3) {
    message = process.argv[2];
} else if (process.argv.length === 4) {
    title = process.argv[2];
    message = process.argv[3];
} else {
    console.log('Usage:\nnode notify.js [title] [message]\nnode notify.js [message]');
    process.exit();
}

notifier.notify({
    title,
    message
});