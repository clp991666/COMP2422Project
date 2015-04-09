/**
 * Created by LKHO on 10/4/2015.
 */
var records = {};
var selected = {};

function changeTable(table) {
    var t = $("#tables").find("[table='" + table + "']");
    $('table').not(t).removeClass('active');
    t.addClass('active');
    var x = $("li[table='" + table + "']");
    x.parent().find("li").removeClass("active");
    x.addClass("active");
}

function clearSelection() {
    if (getSelectionAsArray().length == 0)
        return;
    if (!confirm("Are you sure to clear the selected items?"))
        return;
    selected = {};
    populateTimetables(records, $("#tableTabs li.active").attr('table'));
    displaySelected();
}

function getSelectionAsArray() {
    var arr = [];
    for (var k in selected) {
        var key = k.split('|');
        for (var i = 0; i < selected[k].length; i++)
            arr.push({
                venue: key[0],
                date: key[1],
                time: key[2],
                court: selected[k][i],
                d: Date.parseExact(key[1] + key[2], 'yyyy-MM-ddHH:mm')
            });
    }
    arr.sort(function (a, b) {
        return a.d.getTime() != +b.d.getTime() ? (a.d < b.d ? -1 : 1) :
               (a.venue != b.venue ? (a.venue < b.venue ? -1 : 1) :
                (a.court != b.court ? (a.court < b.court ? -1 : 1) : 0));
    });
    return arr;
}

function getSlotSelection(centre, date, time) {
    var key = centre + "|" + date + "|" + time;
    return selected.hasOwnProperty(key) ? (selected[key].length > 0 ? selected[key] : null) : null;
}

function setSlotSelection(centre, date, time, courts) {
    var key = centre + "|" + date + "|" + time;
    if (courts && courts.length > 0)
        selected[key] = courts;
    else delete selected[key];
}

function selectSlot(target, courts) {
    target = $(target);
    var date = target.attr("date");
    var time = target.attr("time");
    var centre = target.parents("table").attr("table");
    if (courts == null) {
        var previous = getSlotSelection(centre, date, time);
        if (previous) { // previously selected
            if (previous.length == 1 && previous[0] == records.venues[centre][date][time][0])
            // if default selection then toggle
                setSlotSelection(centre, date, time, null);
            else
            // not default means the user has chosen custom court from dropdown, then open the dropdown instead
                return dropdown(target.find('ul.dropdown-menu'));
        } else { // not selected
            setSlotSelection(centre, date, time, [records.venues[centre][date][time][0]]);
        }
    } else {
        setSlotSelection(centre, date, time, courts);
    }
    // refresh button state
    target.find('input[type=checkbox]').prop('checked', !!getSlotSelection(centre, date, time));
    var selection = getSlotSelection(centre, date, time);
    populateDropdown(
        target.find('ul'),
        records.venues[centre][date][time],
        function (court) {
            return selection ? selection.indexOf(court) >= 0 : false;
        });

    displaySelected();
}

function displaySelected() {
    // display selected
    var target = $("#display");
    target.empty();
    var selection = getSelectionAsArray();
    for (var k = 0; k < selection.length; k++) {
        var x = selection[k];
        var s = x.d.toString('yyyy-MM-dd (ddd) HH:mm')
            + x.d.clone().add({ hours: 1 }).toString('-HH:mm<br/>')
            + x.venue
            + " "
            + x.court;
        target.append($('<li class="list-group-item"></li>').html(s));
    }

    if (target.children().length == 0)
        target.append('<li class="list-group-item">Please select a time slot.</li>');
}

function selectCourt(target, court) {
    target = $(target);
    var date = target.attr("date");
    var time = target.attr("time");
    var centre = target.parents("table").attr("table");

    var courts = getSlotSelection(centre, date, time);
    if (courts == null)
        courts = [court];
    else {
        var i = courts.indexOf(court);
        if (i < 0)
            courts.push(court);
        else
            courts.splice(i, 1);
    }
    selectSlot(target, courts);
}

function dropdown(target) {
    event.stopPropagation();
    if (event.target.className == 'dropdown-backdrop')
        return;
    $(target).dropdown('toggle');
}

function populateTimetables(data, selecttable) {
    var tabs = $("#tableTabs");
    var tables = $("#tables");
    tabs.empty();
    tables.empty();

    var first = null;
    for (var k in data.venues) {
        if (!data.venues.hasOwnProperty(k)) continue;

        if (first == null) first = k; // get the first table
        // nav tab
        var tab = $("<li role=\"presentation\"></li>")
            .appendTo(tabs)
            .attr("table", k)
            .append($('<a href="javascript:void(0)" onclick="changeTable(this.parentNode.getAttribute(\'table\'))"></a>').text(k));

        // table
        var table = $('<table class="table table-condensed table-bordered"></table>').attr("table", k)
            .appendTo(tables);
        var dateLabels = [];
        for (var q = 0; q < data.dates.length; q++) {
            var d = Date.parseExact(data.dates[q], 'yyyy-MM-dd');
            dateLabels.push(d.toString('d/M (ddd)'));
        }
        var timeLabels = [];
        for (var q = 0; q < data.times.length; q++) {
            var d = Date.parseExact(data.times[q], 'HH:mm');
            timeLabels.push(data.times[q] + '-' + d.add({ hours: 1 }).toString('HH:mm'));
        }
        populateTimetable(table, data.dates, dateLabels, data.times, timeLabels,
            function (d, t) {
                return data.venues[k].hasOwnProperty(d)
                    && data.venues[k][d].hasOwnProperty(t)
                    && data.venues[k][d][t].length > 0;
            },
            function (d, t) {
                var key = d + " " + t;
                return selected.hasOwnProperty(key) && selected[key].length > 0;
            },
            function (d, t) {
                return data.venues[k][d][t];
            },
            function (d, t, court) {
                var key = d + " " + t;
                return selected.hasOwnProperty(key) && selected[key].indexOf(court >= 0);
            });
    }

    // preselect first table
    changeTable(selecttable ? selecttable : first);
}

function populateTimetable(table, dates, dateLabels, times, timeLabels,
                           slotAvailableCallback,
                           slotSelectedCallback,
                           slotDropdownListCallback,
                           slotDropdownListSelectedCallback) {
    var t = $(table);
    t.empty();

    var thead = $("<tr><th>Time \\ Date</th></tr>");
    for (var i = 0; i < dates.length; i++)
        thead.append($("<th></th>").text(dateLabels[i]));
    t.append($("<thead></thead>").append(thead));

    var tbody = $("<tbody></tbody>");
    for (var i = 0; i < times.length; i++) {
        var tr = $("<tr></tr>");
        tr.append($("<th scope=\"row\"></th>").text(timeLabels[i]));
        for (var j = 0; j < dates.length; j++) {
            var td = $('<td></td>').attr("date", dates[j]).attr("time", times[i]);
            if (slotAvailableCallback(dates[j], times[i])) {
                td.addClass("success");
                td.attr('onclick', 'selectSlot(this)');
                td.append($('<input type="checkbox" />').prop('checked', slotSelectedCallback(dates[j], times[i])));
                var dropdown = $('<span class="dropdown" onclick="dropdown($(this).find(\'ul\'))"></span>');
                td.append(dropdown);

                dropdown.append('<span class="glyphicon glyphicon-triangle-bottom" data-toggle="dropdown"></span>');
                var ul = $('<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>');
                dropdown.append(ul);
                var list = slotDropdownListCallback(dates[j], times[i]);
                populateDropdown(ul, list, function (court) {
                    return slotDropdownListSelectedCallback(dates[j], times[i], court);
                });
            }
            tr.append(td);
        }
        tbody.append(tr);
    }
    t.append(tbody);
}

function populateDropdown(ul, list, itemCheckedCallback) {
    ul = $(ul);
    ul.empty();
    for (var k = 0; k < list.length; k++) {
        var li = $('<li role="presentation"></li>')
            .appendTo(ul)
            .append('<a role="menuitem" onclick="event.stopPropagation(); selectCourt($(this).parents(\'td\')[0], this.parentNode.getAttribute(\'court\')); return false;"></a>')
            .attr('court', list[k]);
        li.find('a').text(list[k]);
        if (itemCheckedCallback(list[k]))
            li.addClass('checked');
    }
}

function activityChanged() {
    if (getSelectionAsArray().length > 0)
        if (!confirm('Changing the filter will clear the selection. Continue?'))
            return false;

    selected = {};
    displaySelected();
    $("#tableTabs").empty();
    $("#tables").empty();


    $.ajax({
        url: 'do.php?action=list',
        data: { activity: $("#type").val() },
        success: function (data) {
            populateTimetables(records = data);
        },
        error: function (xhr, status, error) {
            alert("Cannot get available time slots:\n" + xhr.responseText != '' ? xhr.responseText : error);
        }
    });

    return true;
}

function book() {
    if (getSelectionAsArray().length == 0) {
        alert('Please select at least one time slot');
        return false;
    }
    $.ajax({
        url: 'do.php?action=book',
        method: 'POST',
        data: { selection: selected },
        success: function () {

        },
        error: function (xhr, status, error) {

        }
    });
}