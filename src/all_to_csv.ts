import { PrismaClient, SeptaEntry } from '@prisma/client';
import { analyzeSample, collapseSamples, isDataSampleInvalid, isRushHour, SampleAnalysis, SampleData } from './shared';
import { writeFileSync } from 'fs';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';

// initialize database
const adapter = new PrismaBetterSQLite3({
    url: 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

(async () => {
    // pull all septa entries from db
    const allData: any = await prisma.septaEntry.findMany();

    console.log(`Retrieved ${allData.length} minutes of data. Collapsing data into array...`);

    // collapsed data into a 1d array to evenly sample from
    let collapsed = collapseSamples(allData);

    console.log(`Collapsed data into ${collapsed.length} data points. `);

    console.log(`Pruning data set for invalid points. `);

    collapsed = collapsed.filter((e) => !isDataSampleInvalid(e.rawData));

    console.log(`Analyzing data set...`);

    const json: SampleAnalysis[] = collapsed.map((e) => analyzeSample(e));

    console.log(`Combining csv data...`);

    const data = [];

    let columns = ['Route', 'Timestamp', 'Date', 'Time', 'IsRushHour', 'LateMinutes', 'LateSeconds'];

    data.push(columns.join(','));

    for (const analysis of json) {
        const values = [
            analysis.rawData.route_id,
            analysis.timestamp,
            new Date(analysis.timestamp).toLocaleString('en-US', {
                timeZone: 'America/New_York',
            }),
            isRushHour(new Date(analysis.timestamp)),
            analysis.lateness_minutes,
            analysis.lateness_seconds,
        ];
        data.push(values.join(','));
    }
    console.log(`Writing data to data.csv`);

    writeFileSync('./data.csv', data.join('\n'));
})();
