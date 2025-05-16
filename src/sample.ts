import { PrismaClient, SeptaEntry } from '@prisma/client';
import { SampleAnalysis, SampleData } from './shared.js';
import { writeFileSync } from 'fs';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';

// initialize database
const adapter = new PrismaBetterSQLite3({
    url: 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const SAMPLE_SIZE = 1000;
const OUTPUT = './sample_data.json';

// collapses the nested septa entries into one big array of septa times at a specific minute
const collapseSamples = (data: SeptaEntry[]): SampleData[] => {
    let collapsed: SampleData[] = [];
    for (const val of data) {
        const dataJson = JSON.parse((val.json as any).value);

        const routesData: any[] = Object.values(dataJson.routes[0]);
        for (const route of routesData) {
            for (const bus of route) {
                collapsed.push({
                    rawData: bus,
                    route: bus.route_id,
                    timestamp: new Date(bus.timestamp * 1000),
                });
            }
        }
    }
    return collapsed;
};

// randomly samples from the given dataset, as long as the data is valid and it is not already used (from the usedSamples array)
const randomlySample = (data: SampleData[], usedSamples: SampleData[]): SampleData => {
    const size = data.length;
    const randomIndex = Math.floor(Math.random() * size);

    const sample = data[randomIndex];

    const isUsed = usedSamples.includes(sample);

    const dataSample = sample.rawData;

    const isInvalid =
        dataSample.next_stop_id === null ||
        dataSample.next_stop_name === null ||
        dataSample.next_stop_sequence === null ||
        dataSample.heading === null ||
        dataSample.late === 999 ||
        dataSample.late === 998;

    if (isUsed || isInvalid) {
        return randomlySample(data, usedSamples);
    }

    usedSamples.push(sample);

    return sample;
};

// Pull important information from each sample (eg. lateness in seconds and minutes, time stamp of the sample point, etc. )
const analyzeSample = (sampleData: SampleData): SampleAnalysis => {
    const busData = sampleData.rawData;

    const latenessSeconds = parseInt(busData['Offset_sec']);
    const timestamp = new Date(busData['timestamp'] * 1000);

    return {
        rawData: busData,
        lateness_seconds: latenessSeconds,
        lateness_minutes: latenessSeconds / 60,
        timestamp,
    };
};

(async () => {
    // pull all septa entries from db
    const allData: any = await prisma.septaEntry.findMany();

    console.log(`Retrieved ${allData.length} minutes of data. Collapsing data into array...`);

    // collapsed data into a 1d array to evenly sample from
    const collapsed = collapseSamples(allData);

    console.log(`Collapsed data into ${collapsed.length} data points. `);

    // generate SAMPLE_SIZE random samples

    console.log(`Generating ${SAMPLE_SIZE} random samples...`);
    const usedSamples: SampleData[] = [];

    const nonRepeatingSamples = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        nonRepeatingSamples.push(randomlySample(collapsed, usedSamples));
    }

    // pull important data from the samples
    console.log(`Generated random samples. Analyzing samples...`);
    const analysis = nonRepeatingSamples.map((e) => analyzeSample(e));

    // write sample data to output file
    console.log(`Writing analysis to file: ${OUTPUT}`);
    writeFileSync(OUTPUT, JSON.stringify(analysis));
})();
