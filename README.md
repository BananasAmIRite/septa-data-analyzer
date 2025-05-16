# SEPTA Data Analyzer

A utility program that can pull realtime (lateness) data from SEPTA API

## Setup

1. Run `npm install` with [nodejs](https://nodejs.org/en) installed to install all packages required for the project
2. Create a `.env` file in the root repository with:

```env
DATABASE_URL="file:./dev.db"
```

3. Run `npx prisma generate` and `npx prisma db push` to initialize the database

To run a script, run `npx ts-node src/[script].ts`

## Scripts

-   `log.ts` - Indefinitely pulls SEPTA data every minute and pushes into the database
-   `sample.ts` - Samples a set number of data points from the total gathered data
-   `analyze.ts` - Prints sample statistics for non-rush hour and rush-hour data
-   `output_csv.ts` - Outputs all the sample data into a CSV format for exporting
-   `output_chi2.ts` - Creates a chi-squared table for the sample data and exports as csv
