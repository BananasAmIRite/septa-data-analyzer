import { PrismaClient, SeptaEntry } from '@prisma/client';
import type { Sample, SampleAnalysis, SampleData } from './types.d.ts';
import { writeFileSync } from 'fs';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { DatasetController } from 'chart.js';

const adapter = new PrismaBetterSQLite3({
    url: 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const SAMPLE_SIZE = 1000;
const OUTPUT = './sample_data.json';

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
                });
            }
        }
    }
    return collapsed;
};

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

const analyzeSample = (sampleData: SampleData): SampleAnalysis => {
    const busData = sampleData.rawData;

    const latenessSeconds = parseInt(busData['Offset_sec']);
    // const latenessMinutes = busData['late'];
    const timestamp = new Date(busData['timestamp'] * 1000);

    return {
        rawData: busData,
        lateness_seconds: latenessSeconds,
        lateness_minutes: latenessSeconds / 60,
        timestamp,
    };
};

(async () => {
    const allData: any = await prisma.septaEntry.findMany();

    console.log(`Retrieved ${allData.length} minutes of data. Collapsing data into array...`);

    const collapsed = collapseSamples(allData);

    console.log(`Collapsed data into ${collapsed.length} data points. `);

    const usedSamples: SampleData[] = [];

    console.log('Generating random samples...');

    const nonRepeatingSamples = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        nonRepeatingSamples.push(randomlySample(collapsed, usedSamples));
    }

    console.log(`Generated random samples. Analyzing samples...`);

    const analysis = nonRepeatingSamples.map((e) => analyzeSample(e));

    console.log(`Writing analysis to file: ${OUTPUT}`);
    writeFileSync(OUTPUT, JSON.stringify(analysis));
})();
