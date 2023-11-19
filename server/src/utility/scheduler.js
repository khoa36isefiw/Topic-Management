function min(a, b) {
    return a < b ? a : b;
}

function max(a, b) {
    return a > b ? a : b;
}

function intersectSchedule(s1, s2) {
    const first = s1.start < s2.start ? s1 : s2;
    const second = s1.start > s2.start ? s1 : s2;
    if (first.end > second.start) return { start: second.start, end: min(first.end, second.end) };
    else return null;
}

function unionSchedule(s1, s2) {
    return { start: min(s1.start, s2.start), end: max(s1.end, s2.end) };
}

function combineSchedules(schedules) {
    return schedules.flat(3);
}

function trimSchedules(schedules, trimSchedule) {
    const trimmed = [];

    for (const schedule of schedules) {
        const intersect = intersectSchedule(schedule, trimSchedule);
        if (intersect) {
            trimmed.push(schedule);
        }
    }

    return trimmed;
}

function intervalListDifference(minuend, subtrahend) {
    // solution here
    // https://stackoverflow.com/questions/11891109/algorithm-to-produce-a-difference-of-two-collections-of-intervals

    const intervals = [...minuend, ...subtrahend];
    const points = [];

    for (const interval of intervals) {
        points.push({ start: true, time: interval.start });
        points.push({ start: false, time: interval.end });
    }

    points.sort((a, b) => a.time.getTime() - b.time.getTime());

    const difference = [];
    let depth = 0;
    let current = {};
    for (const point of points) {
        depth += point.start ? 1 : -1;
        if (depth === 1) {
            current.start = point.time;
        } else {
            current.end = point.time;
            difference.push(current);
            current = {};
        }
    }

    return difference.filter(e => minuend.some(e2 => intersectSchedule(e, e2)));
}

const Scheduler = {
    GetScheduleRange: (schedules) => {
        if (schedules.length === 0) return null;
    
        let range = { ...schedules[0] };
    
        for (let i = 1; i < schedules.length; i++) {
            range = unionSchedule(range, schedules[i]);
        }
    
        return range;
    },

    SortSchedules: (schedules) => {
        schedules.sort((a, b) => {
            const startDiff = a.start - b.start;
            if (startDiff !== 0) return startDiff;
            return a.end - b.end;
        });
    },

    MergeOverlappingSchedules: (schedules) => {
        if (schedules.length === 0) return [];

        const merged = [];
        let start = schedules[0].start;
        let end = schedules[0].end;
        //let adding = true;

        for (let i = 1; i < schedules.length; i++) {
            if (schedules[i].start > end) {
                merged.push({ start, end });
                start = schedules[i].start;
                end = schedules[i].end;
            } else if (schedules[i].end > end) {
                end = schedules[i].end;
            }
        }

        merged.push({ start, end });
        return merged;
    },

    AutoSchedule: (freeRanges, schedules) => {
        const freeRange = Scheduler.GetScheduleRange(freeRanges);
        
        const consolidated = combineSchedules(schedules.map(e => e.map(e2 => trimSchedules(e2, freeRange))));
        Scheduler.SortSchedules(consolidated);

        const busyRanges = Scheduler.MergeOverlappingSchedules(consolidated);
        return intervalListDifference(freeRanges, busyRanges);
    }
};

module.exports = Scheduler;
