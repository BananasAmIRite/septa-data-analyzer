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
