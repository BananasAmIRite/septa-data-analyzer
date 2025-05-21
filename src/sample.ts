import { PrismaClient, SeptaEntry } from '@prisma/client';
import { analyzeSample, collapseSamples, isDataSampleInvalid, isWeekend, SampleAnalysis, SampleData } from './shared';
import { writeFileSync } from 'fs';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';

// initialize database
const adapter = new PrismaBetterSQLite3({
    url: 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const SAMPLE_SIZE = 3000;
const OUTPUT = './sample_data.json';

// randomly samples from the given dataset, as long as the data is valid and it is not already used (from the usedSamples array)
const randomlySample = (data: SampleData[], usedSamples: SampleData[]): SampleData => {
    const size = data.length;
    const randomIndex = Math.floor(Math.random() * size);

    const sample = data[randomIndex];

    const isUsed = usedSamples.includes(sample);

    const dataSample = sample.rawData;

    const isInvalid = isDataSampleInvalid(dataSample);

    const weekend = isWeekend(new Date(sample.timestamp));

    if (isUsed || isInvalid || weekend) {
        return randomlySample(data, usedSamples);
    }

    usedSamples.push(sample);

    return sample;
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
