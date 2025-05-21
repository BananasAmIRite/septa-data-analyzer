import { readFileSync, writeFileSync } from 'fs';
import { std, mean, median } from 'mathjs';
import { DataSetAnalysis, SampleAnalysis, splitData } from './shared';

const INPUT = './sample_data.json';

const analyzeData = (json: SampleAnalysis[]): DataSetAnalysis => {
    const seconds = json.map((e) => e.lateness_seconds);
    const minutes = json.map((e) => e.lateness_minutes);
    return {
        meanMinutes: mean(minutes),
        stdMinutes: std(minutes, 'unbiased') as number,
        medianMinutes: median(minutes),
        meanSeconds: mean(seconds),
        stdSeconds: std(seconds, 'unbiased') as number,
        medianSeconds: median(seconds),
        n: json.length,
    };
};

(() => {
    const json: SampleAnalysis[] = JSON.parse(readFileSync(INPUT, 'utf-8'));
    const { rushHour, nonRushHour } = splitData(json);

    const rushHourAnalysis = analyzeData(rushHour);
    const nonRushHourAnalysis = analyzeData(nonRushHour);

    const pooledAnalysis = analyzeData(json);

    console.log(`Rush Hour Stats: `);
    console.log(rushHourAnalysis);
    console.log(`Non-Rush Hour Stats: `);
    console.log(nonRushHourAnalysis);
    console.log(`Pooled: `);
    console.log(pooledAnalysis);

    const out = [
        ',Sample Size,Mean (minutes),Median (minutes),Standard Deviation (minutes)',
        [
            'Rush Hour',
            rushHourAnalysis.n,
            rushHourAnalysis.meanMinutes,
            rushHourAnalysis.medianMinutes,
            rushHourAnalysis.stdMinutes,
        ].join(','),
        [
            'Not Rush Hour',
            nonRushHourAnalysis.n,
            nonRushHourAnalysis.meanMinutes,
            nonRushHourAnalysis.medianMinutes,
            nonRushHourAnalysis.stdMinutes,
        ].join(','),
        [
            'Pooled',
            pooledAnalysis.n,
            pooledAnalysis.meanMinutes,
            pooledAnalysis.medianMinutes,
            pooledAnalysis.stdMinutes,
        ].join(','),
    ];

    writeFileSync('./analysis.csv', out.join('\n'));
})();
