var sampledata = {
    dates: [],
    times: [],
    venues: {
        "Shaw": {
            "2015-01-01": {
                "08:30-09:30": ['B01', 'B02', 'B03'],
                "09:30-10:30": ['B01', 'B02', 'B03'],
                "10:30-11:30": ['B01', 'B02', 'B03'],
                "11:30-12:30": ['B01', 'B02', 'B03']
            },
            "2015-01-02": {
                "08:30": ['01', '02', '03'],
                "09:30": ['01', '02', '03']
            },
            "2015-01-03": {
                "08:30": ['01', '02', '03'],
                "09:30": ['01', '02', '03']
            }
        }
    }
};

function fetchRecord(activity) {
    // fake records generator

    var today = Date.today();
    var dates = [];
    var times = [];

    for (var i = 0; i < 7; i++) {
        today.addDays(1);
        if (today.getDay() != 0 && today.getDay() != 6)
            dates.push(today.toString("dd/MM (ddd)"));
    }
    var d = Date.today();
    for (var h = 8; h <= 21; h++) {
        d.set({ hour: h, minute: 30 });
        times.push(d.toString("HH:mm") + "-" + d.add({ hours: 1 }).toString("HH:mm"));
    }
    var prefix = activity.substr(0, 1).toUpperCase();
    return {
        dates: dates,
        times: times,
        venues: {
            "Shaw": randomSlots(prefix, dates, times),
            "Kwong On": randomSlots(prefix, dates, times),
            "Hall": randomSlots(prefix, dates, times)
        }
    };
}

function randomSlots(prefix, dates, times) {
    // fake records generator

    var result = {};
    for (var d = 0; d < dates.length; d++) {
        var date = dates[d];
        var day = result[date] = {};

        for (var t = 0; t < times.length; t++) {
            var time = times[t];
            var slots = day[time] = [];
            if (Math.random() > .5)
                for (var court = 1; court <= 10; court++) {
                    if (Math.random() > .4) continue;
                    slots.push(prefix + ("00" + court.toString()).slice(-2));
                }
        }

    }
    return result;
}