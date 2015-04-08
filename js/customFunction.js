		var date;
		var start = 22;
		var end = 9;
		var currentBooking;

		$("document").ready(function () {
			changeTable("#table0");
		});
		function select() {
			$('#addMeeting').hide();
			$('#selectDateTime').show();
		}
		function goBack() {
			$('#addMeeting').show();
			$('#selectDateTime').hide();
			$('#dateTime').val(date + " " + start + ":00-" + end + ":00");

		}
		function checked(target) {
			if ($(target).has("span.glyphicon-ok").length >0) { 
				console.log("true");
				$(target).children('span.glyphicon-ok').remove();
			}

			else $(target).prepend('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span>');
			date = $(target).attr('date');
			if ($(target).attr('startTime') < start) start = $(target).attr('startTime');
			if ($(target).attr('endTime') > end) end = $(target).attr('endTime');
		}

		function changeTable(table) {
			var t = $(table);
			$('table').not(t).removeClass('active');
			t.addClass('active');
			var x = $("li[table=" + table + "]");
			x.parent().find("li").removeClass("active");
			x.addClass("active");
		}

		function expand() {
			alert("Right click");
		}

		function selectSlot(target) {
			target = $(target);
			target.toggleClass("checked");
		}

		function populateTimetable(table, dates, dateLabels, times, timeLabels,
			slotAvailableCallback,
			slotCheckedCallback) {
			var t = $(table);
			t.empty();

			var thead = $("<tr><th>Time\\Date</th></tr>");
			for (var i = 0; i < dates.length; i++)
				thead.append($("<th></th>").text(dateLabels[i]));
			t.append($("<thead></thead>").append(thead));

			var tbody = $("<tbody></tbody>");
			for (var i = 0; i < times.length; i++) {
				var tr = $("<tr></tr>");
				tr.append($("<th scope=\"row\"></th>").text(timeLabels[i]));
				for (var j = 0; j < dates.length; j++) {
					var td = $("<td></td>").attr("date", dates[i]).attr("time", times[j]);
					if (slotAvailableCallback(dates[i], times[j])) {
						td.addClass("success");
						td.attr("onclick", "selectSlot(this)");
					}
					if (slotCheckedCallback(dates[i], times[j])) {
						td.addClass("checked");
					}
					tr.append(td);
				}
				tbody.append(tr);
			}
			t.append(tbody);
		}

		$(function () {
			populateTimetable("#bookingTable #table0",
				[1, 2, 3],
				["1d", "2d", "3d"],
				[0, 1, 2, 3, 4, 5],
				[0, 1, 2, 3, 4, 5],
				function () {
					return Math.random() > .5;
				}, function () {
					return Math.random() > .5;
				}
				);
		})
		function listChecked(target){
			event.stopPropagation();
			
			td=$(target).parent().parent().parent().parent();

			if (!($(td).has("span.glyphicon-ok").length >0))  $(td).prepend('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span>');
			$(target).parent().dropdown('toggle');

		}
		function dropdown(target){
			event.stopPropagation();
			$(target).dropdown('toggle');
		}

		function registerBooking(target){
			currentBooking=target;
			console.log(currentBooking);
		}

		function dismissBooking(content){
			$(currentBooking).parents('tr').remove();
			$(".page-header").prepend('<div class="alert alert-success alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>The booking is successfully '+content+'.</div>')
		}
