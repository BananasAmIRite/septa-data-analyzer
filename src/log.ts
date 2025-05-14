import { PrismaClient } from '@prisma/client';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';

const prisma = new PrismaClient();

const fetchData = async () => {
    const data = await fetch('https://www3.septa.org/api/TransitViewAll/index.php');
    let json;
    try {
        json = await data.json();
    } catch (err) {
        console.log(`Fetching error: ${err}`);
        console.log(`Data status: ${data.status}`);
        console.log(`Data text: ${await data.text()}`);
        throw err;
    }

    return json;
};

const fetchAndUpload = async () => {
    console.log('Fetching data...');
    const start = Date.now();
    const data = await fetchData();
    const time = new Date(); // current timestamp
    await prisma.septaEntry.create({
        data: {
            timestamp: time,
            json: data,
        },
    });

    console.log(
        `Fetched data with ${Object.keys(data.routes[0]).length} routes at timestamp ${time.toISOString()} in ${
            Date.now() - start
        } milliseconds`
    );
};

(async () => {
    await fetchAndUpload();
})();

const scheduler = new ToadScheduler();
const updateJob = new SimpleIntervalJob(
    { seconds: 60 },
    new AsyncTask(
        'update-db',
        async () => {
            await fetchAndUpload();
        },
        (err) => {
            console.log(`An error occurred while fetching data from septa: ` + err);
        }
    )
);

scheduler.addSimpleIntervalJob(updateJob);
