import cron from 'cron';
import https from 'https';

const job = new cron.CronJob("*/14 * * * *", function () {
    https.get(process.env.APT_URL, (res) => {
        if(res.statusCode === 200)  console.error(`GET request sent successfully. Status Code: ${res.statusCode}`);   
        else console.log(`GET request failed. Status Code: ${res.statusCode}`);
    }).on('error', (e) => console.error("Error while sending GET request: ", e));
});

export default  job;