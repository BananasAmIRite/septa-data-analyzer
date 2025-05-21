import { SeptaEntry } from '@prisma/client';

export interface Sample {
    index: number;
    route: string;
    routeIndex: number;
}

export interface SampleData {
    rawData: any;
    route: string;
    timestamp: Date;
}

export interface SampleAnalysis {
    rawData: any;
    lateness_seconds: number;
    lateness_minutes: number;
    timestamp: Date;
}

export interface DataSetAnalysis {
    meanSeconds: number;
    meanMinutes: number;
    medianSeconds: number;
    medianMinutes: number;
    stdSeconds: number;
    stdMinutes: number;
    n: number;
}

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

// collapses the nested septa entries into one big array of septa times at a specific minute
export const collapseSamples = (data: SeptaEntry[]): SampleData[] => {
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

// Pull important information from each sample (eg. lateness in seconds and minutes, time stamp of the sample point, etc. )
export const analyzeSample = (sampleData: SampleData): SampleAnalysis => {
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

export const isDataSampleInvalid = (dataSample: any) =>
    dataSample.next_stop_id === null ||
    dataSample.next_stop_name === null ||
    dataSample.next_stop_sequence === null ||
    // dataSample.heading === null ||
    dataSample.late === 999 ||
    dataSample.late === 998;

export const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
