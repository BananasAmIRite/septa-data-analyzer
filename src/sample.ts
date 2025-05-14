import { PrismaClient, SeptaEntry } from '@prisma/client';
import type { Sample, SampleAnalysis } from './types.d.ts';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

const SAMPLE_SIZE = 1000;
const OUTPUT = './sample_data.json';

const randomlySample = (data: SeptaEntry[], usedSamples: Sample[]): Sample => {
    const size = data.length;
    const randomIndex = Math.floor(Math.random() * size);

    const dataJson = data[randomIndex].json as any;

    const possibleRoutes = Object.keys(dataJson.routes[0]);
    const randomRoute = possibleRoutes[Math.floor(Math.random() * possibleRoutes.length)];

    const randomRouteIndex = Math.floor(Math.random() * dataJson.routes[0][randomRoute].length);

    const sample: Sample = {
        index: randomIndex,
        route: randomRoute,
        routeIndex: randomRouteIndex,
    };

    const isUsed =
        usedSamples.findIndex(
            (e) => e.index === sample.index && e.route === sample.route && e.routeIndex === sample.routeIndex
        ) !== -1;

    const dataSample = dataJson.routes[0][randomRoute][randomRouteIndex];

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

const fetchSample = (data: SeptaEntry[], sample: Sample) => {
    return (data[sample.index].json as any).routes[0][sample.route][sample.routeIndex];
};

const analyzeSample = (allData: SeptaEntry[], sample: Sample): SampleAnalysis => {
    const busData = fetchSample(allData, sample);

    const latenessSeconds = parseInt(busData['Offset_sec']);
    const latenessMinutes = busData['late'];
    const timestamp = new Date(busData['timestamp'] * 1000);

    return {
        sample,
        rawData: busData,
        lateness_seconds: latenessSeconds,
        lateness_minutes: latenessMinutes,
        timestamp,
    };
};

(async () => {
    const allData = await prisma.septaEntry.findMany();

    const usedSamples: Sample[] = [];

    console.log('Generating random samples...');

    const nonRepeatingSamples = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        nonRepeatingSamples.push(randomlySample(allData, usedSamples));
    }

    console.log(`Generated random samples. Analyzing samples...`);

    console.log(nonRepeatingSamples);
    const analysis = nonRepeatingSamples.map((e) => analyzeSample(allData, e));

    console.log(`Writing analysis to file: ${OUTPUT}`);
    writeFileSync(OUTPUT, JSON.stringify(analysis));
})();
