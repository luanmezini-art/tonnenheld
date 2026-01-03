import { BinType } from "./storage";

export const STREETS = ["Hobergerfeld", "Kerkebrink", "Westfeld"] as const;
export type Street = typeof STREETS[number];

type ScheduleRule = {
    intervalDays: 7 | 14 | 28;
    anchorDate: string; // A confirmed valid date in the past or future
}

// Anchors inferred from previous logic (Even/Odd) using Dec 2024 / Jan 2025 as base.
// Hobergerfeld: Rest (Even Mon -> Dec 23), Bio (Odd Mon -> Dec 30), Gelb (Odd Thu -> Jan 2), Papier (Tue -> Jan 20)
// Kerkebrink: Rest (Odd Fri -> Jan 3), Bio (Even Fri -> Dec 27), Gelb (Odd Wed -> Jan 1 ?? Holiday! -> Jan 2), Papier (Fri -> Dec 5 -> Jan 2 (Thu?))
// Westfeld: Rest (Odd Tue -> Dec 31), Bio (Even Tue -> Dec 24), Gelb (Odd Fri -> Jan 3), Papier (Tue -> Jan 20)

const STATIC_SCHEDULES: Record<string, Record<BinType, string[]>> = {
    // Hobergerfeld & Westfeld (Monday District)
    "Hobergerfeld": {
        "Restmüll": ["2025-12-08", "2025-12-20", "2026-01-05", "2026-01-19", "2026-02-02", "2026-02-16", "2026-03-02", "2026-03-16", "2026-03-28", "2026-04-13", "2026-04-27", "2026-05-11", "2026-05-26", "2026-06-08", "2026-06-22", "2026-07-06", "2026-07-20", "2026-08-03", "2026-08-17", "2026-08-31", "2026-09-14", "2026-09-28"],
        "Bio": ["2025-12-01", "2025-12-15", "2025-12-29", "2026-01-12", "2026-01-26", "2026-02-09", "2026-02-23", "2026-03-09", "2026-03-23", "2026-04-07", "2026-04-20", "2026-05-04", "2026-05-18", "2026-06-01", "2026-06-15", "2026-06-29", "2026-07-13", "2026-07-27", "2026-08-10", "2026-08-24", "2026-09-07", "2026-09-21"],
        "Papier": ["2025-12-22", "2026-01-20", "2026-02-17", "2026-03-17", "2026-04-14", "2026-05-12", "2026-06-09", "2026-07-07", "2026-08-04", "2026-09-01", "2026-09-29"],
        "Gelber Sack": ["2025-12-04", "2026-01-02", "2026-01-29", "2026-02-26", "2026-03-26", "2026-04-23", "2026-05-21", "2026-06-18", "2026-07-16", "2026-08-13", "2026-09-10"]
    },
    "Westfeld": {
        // Exact same as Hobergerfeld
        "Restmüll": ["2025-12-08", "2025-12-20", "2026-01-05", "2026-01-19", "2026-02-02", "2026-02-16", "2026-03-02", "2026-03-16", "2026-03-28", "2026-04-13", "2026-04-27", "2026-05-11", "2026-05-26", "2026-06-08", "2026-06-22", "2026-07-06", "2026-07-20", "2026-08-03", "2026-08-17", "2026-08-31", "2026-09-14", "2026-09-28"],
        "Bio": ["2025-12-01", "2025-12-15", "2025-12-29", "2026-01-12", "2026-01-26", "2026-02-09", "2026-02-23", "2026-03-09", "2026-03-23", "2026-04-07", "2026-04-20", "2026-05-04", "2026-05-18", "2026-06-01", "2026-06-15", "2026-06-29", "2026-07-13", "2026-07-27", "2026-08-10", "2026-08-24", "2026-09-07", "2026-09-21"],
        "Papier": ["2025-12-22", "2026-01-20", "2026-02-17", "2026-03-17", "2026-04-14", "2026-05-12", "2026-06-09", "2026-07-07", "2026-08-04", "2026-09-01", "2026-09-29"],
        "Gelber Sack": ["2025-12-04", "2026-01-02", "2026-01-29", "2026-02-26", "2026-03-26", "2026-04-23", "2026-05-21", "2026-06-18", "2026-07-16", "2026-08-13", "2026-09-10"]
    },
    "Kerkebrink": {
        // Wednesday/Thursday District - Completely different!
        "Restmüll": [
            "2025-12-03", "2025-12-17", "2025-12-31",
            "2026-01-14", "2026-01-28",
            "2026-02-11", "2026-02-25",
            "2026-03-11", "2026-03-25",
            "2026-04-09", // Thu Shift
            "2026-04-22",
            "2026-05-06", "2026-05-20",
            "2026-06-03", "2026-06-17",
            "2026-07-01", "2026-07-15", "2026-07-29",
            "2026-08-12", "2026-08-26",
            "2026-09-09", "2026-09-23"
        ],
        "Bio": [
            "2025-12-10", "2025-12-23", // Tue Shift
            "2026-01-07", "2026-01-21",
            "2026-02-04", "2026-02-18",
            "2026-03-04", "2026-03-18", "2026-03-31", // Tue Shift
            "2026-04-15", "2026-04-29",
            "2026-05-13", "2026-05-28", // Thu Shift
            "2026-06-10", "2026-06-24",
            "2026-07-08", "2026-07-22",
            "2026-08-05", "2026-08-19",
            "2026-09-02", "2026-09-16", "2026-09-30"
        ],
        "Papier": [
            "2025-12-03", "2025-12-31",
            "2026-01-28",
            "2026-02-25",
            "2026-03-25",
            "2026-04-22",
            "2026-05-20",
            "2026-06-17",
            "2026-07-15",
            "2026-08-12",
            "2026-09-09"
        ],
        "Gelber Sack": [
            "2025-12-11",
            "2026-01-08",
            "2026-02-05",
            "2026-03-05",
            "2026-04-01", // Wed Shift
            "2026-05-29", // Fri Shift
            "2026-06-25",
            "2026-07-23",
            "2026-08-20",
            "2026-09-17"
        ]
    }
}
// Algorithmic Rules (Fallback / Other Streets) - DISABLED / LEGACY
const SCHEDULES: Record<Street, Record<BinType, ScheduleRule>> = {} as any;

// NRW Holidays 2025 + Late 2024
const HOLIDAYS = [
    '2024-12-25', '2024-12-26',
    '2025-01-01',
    '2025-04-18', '2025-04-21',
    '2025-05-01', '2025-05-29',
    '2025-06-09', '2025-06-19',
    '2025-10-03', '2025-11-01',
    '2025-12-25', '2025-12-26'
];

function applyHolidayShift(date: Date): Date {
    const d = new Date(date);
    const isoDate = d.toISOString().split('T')[0];

    // Get Monday of this week
    const monday = new Date(d);
    const day = monday.getDay() || 7; // 1=Mon, 7=Sun
    if (day !== 1) monday.setDate(monday.getDate() - (day - 1));

    // Check holidays between Monday and OriginalDate
    let shift = 0;

    // Loop through holidays to see if any fall in [Monday, OriginalDate]
    for (const h of HOLIDAYS) {
        const hDate = new Date(h);
        if (hDate >= monday && hDate <= d) {
            shift++;
        }
    }

    d.setDate(d.getDate() + shift);

    // Verify if new date is a holiday (rare double shift)
    const newStr = d.toISOString().split('T')[0];
    if (HOLIDAYS.includes(newStr)) {
        d.setDate(d.getDate() + 1);
    }

    return d;
}

export function getNextDates(street: string, binType: BinType, count: number = 5): Date[] {
    // Check Static First
    const staticDates = STATIC_SCHEDULES[street]?.[binType];
    const now = new Date();
    // Normalize now to midnight for comparison
    now.setHours(0, 0, 0, 0);

    if (staticDates) {
        return staticDates
            .map(d => new Date(d))
            .filter(d => {
                // normalize d to midnight just in case, though they are YYYY-MM-DD
                const dDate = new Date(d);
                dDate.setHours(0, 0, 0, 0);
                return dDate >= now;
            })
            .sort((a, b) => a.getTime() - b.getTime())
            .slice(0, count);
    }

    // Fallback to Algorithmic
    const dates: Date[] = [];
    const rule = SCHEDULES[street as Street]?.[binType];

    if (!rule) return [];

    const anchor = new Date(rule.anchorDate);

    let current = new Date(anchor);
    if (current < now) {
        while (current < now) {
            current.setDate(current.getDate() + rule.intervalDays);
        }
    }

    while (dates.length < count) {
        const realDate = applyHolidayShift(new Date(current));
        if (realDate >= now) {
            dates.push(realDate);
        }
        current.setDate(current.getDate() + rule.intervalDays);
    }
    return dates;
}

// Generate ALL valid dates for a given year (or wide range) to populate the calendar
export function getDatesForRange(street: string, binType: BinType, start: Date, end: Date): Date[] {
    // Check Static First
    const staticDates = STATIC_SCHEDULES[street]?.[binType];
    if (staticDates) {
        return staticDates
            .map(d => new Date(d))
            .filter(d => d >= start && d <= end)
            .sort((a, b) => a.getTime() - b.getTime());
    }

    // Fallback to Algorithmic
    const dates: Date[] = [];
    const rule = SCHEDULES[street as Street]?.[binType];
    if (!rule) return [];

    const anchor = new Date(rule.anchorDate);

    // 1. Move current to just before start
    let current = new Date(anchor);
    const safeStart = new Date(start);
    safeStart.setDate(safeStart.getDate() - 30); // Buffer

    if (current < safeStart) {
        const diffTime = safeStart.getTime() - current.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const intervals = Math.floor(diffDays / rule.intervalDays);
        current.setDate(current.getDate() + (intervals * rule.intervalDays));
    } else {
        while (current > safeStart) {
            current.setDate(current.getDate() - rule.intervalDays);
        }
    }

    // 2. Iterate until end
    while (current <= end) {
        const realDate = applyHolidayShift(new Date(current));
        if (realDate >= start && realDate <= end) {
            dates.push(realDate);
        }
        current.setDate(current.getDate() + rule.intervalDays);
    }

    return dates;
}
