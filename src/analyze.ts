import { readFileSync } from 'fs';
import { std, mean, median } from 'mathjs';
import { DataSetAnalysis, SampleAnalysis } from './types';

const INPUT = './sample_data.json';

export const isRushHour = (date: Date) => {
    return (date.getHours() >= 7 && date.getHours() < 9) || (date.getHours() >= 15 && date.getHours() < 18);
};

export const splitData = (json: SampleAnalysis[]): { rushHour: SampleAnalysis[]; nonRushHour: SampleAnalysis[] } => {
    const rushHour: SampleAnalysis[] = [];
    const nonRushHour: SampleAnalysis[] = [];
    for (const sample of json) {
        if (isRushHour(new Date(sample.timestamp))) {
            rushHour.push(sample);
        } else {
            nonRushHour.push(sample);
        }
    }
    return {
        rushHour,
        nonRushHour,
    };
};

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

    console.log(rushHourAnalysis);
    console.log(nonRushHourAnalysis);
})();
