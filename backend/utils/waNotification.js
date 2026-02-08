const axios = require('axios');

const FONNTE_TOKEN = 'KQ1XKbd2ZHue4cn9e7hc';

/**
 * Send WhatsApp notification via Fonnte
 * @param {string} target - WhatsApp number (e.g. 62812...)
 * @param {string} message - The message content
 */
const sendWANotification = async (target, message) => {
    if (!target || target === '-') {
        console.log('Skipping WA notification: No target number');
        return;
    }

    try {
        const response = await axios.post('https://api.fonnte.com/send', {
            target,
            message,
            countryCode: '62'
        }, {
            headers: {
                'Authorization': FONNTE_TOKEN
            }
        });
        console.log('Fonnte Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Fonnte Error:', error.response ? error.response.data : error.message);
    }
};

module.exports = { sendWANotification };
