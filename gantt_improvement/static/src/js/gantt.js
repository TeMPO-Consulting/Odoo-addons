/*---------------------------------------------------------
 * OpenERP gantt_improvement
 *---------------------------------------------------------*/
console.log("test");
openerp.gantt_improvement = function (instance) {
    var _t = instance.web._t,
       _lt = instance.web._lt;
    var QWeb = instance.web.qweb;
    var date_begin = null;
    var date_end = null;
    var day_today = 0;
    var day_end = 0;
    var day_offset = 0;
    var projects = null;

    instance.web.views.add('gantt', 'instance.gantt_improvement.GanttView');
    instance.gantt_improvement.GanttView = instance.web_gantt.GanttView.extend({
        events: {
            'click .oe_gantt_buttons_days .previous_week': 'previous_week',
            'click .oe_gantt_buttons_days .previous_day': 'previous_day',
            'click .oe_gantt_buttons_days .today': 'today',
            'click .oe_gantt_buttons_days .next_day': 'next_day',
            'click .oe_gantt_buttons_days .next_week': 'next_week',
            'click .oe_gantt_buttons_days .go_date': 'go_date',
            'click .oe_gantt_buttons_days .gantt_improvement_input_date': 'go_date',
        },
        init: function(parent) {

            var self = this;
            new instance.web.Model("res.users").query(["day_offset"]).first().then(function(result) {
                day_offset = result.day_offset;
            });

            this._super.apply(this, arguments);
            this.has_been_loaded = $.Deferred();
            this.chart_id = _.uniqueId();
            this.today();
        },
        on_data_loaded: function(tasks, group_bys) {
            var self = this;
            var ids = _.pluck(tasks, "id");
            return this.dataset.name_get(ids).then(function(names) {
                var ntasks = _.map(tasks, function(task) {
                    return _.extend({__name: _.detect(names, function(name) { return name[0] == task.id; })[1]}, task); 
                });
                date_begin = null;
                date_end = null;
                day_today = 0;
                day_end = 0;
                for (var i in ntasks) {
                    if (ntasks[i].date_end != false && ntasks[i].date_start != false) {
                        if (date_end == null || date_end < ntasks[i].date_end)
                             date_end = ntasks[i].date_end;
                        if (date_begin == null || date_begin > ntasks[i].date_start)
                            date_begin = ntasks[i].date_start;
                    }
                }
                date_begin = instance.web.auto_str_to_date(date_begin);
                date_end = instance.web.auto_str_to_date(date_end);
                day_end = Math.round((date_end - date_begin)/(1000*60*60*24));
                day_today = Math.round((new Date() - date_begin)/(1000*60*60*24));
                return self.on_data_loaded_2(ntasks, group_bys);
            });
        },
        change_scroll: function(day, absolute) {
            absolute = absolute || false;
            var old_value = $(".oe_gantt > table > tbody > tr > td:nth-child(2n) > div").scrollLeft();
            if (absolute) {
                old_value = 0;
            }
            $(".oe_gantt > table > tbody > tr > td:nth-child(2n) > div").addClass("oe_gantt_overflow");
            var day_size_px = $(".dayNumber:first").width();
            var px = old_value + (day * day_size_px);
            if (px < 0)
                px = 0;
            $(".oe_gantt > table > tbody > tr > td:nth-child(2n) > div").scrollLeft(px);
        },
        previous_week: function() {
            this.change_scroll(-7);
        },
        previous_day: function() {
            this.change_scroll(-1);
        },
        today: function() {
            if ($('.taskPanel').length != 0) {
                $(".oe_gantt > table > tbody > tr > td > div").scroll(function(event) {
                    console.log("scroll");
                    $(".oe_gantt > table > tbody > tr > td").scrollTop($(this).scrollTop());
                });
                this.change_scroll(day_today - day_offset, true);
            } else {
                var self = this;
                setTimeout(function(){self.today();}, 300);
            }
            
        },
        go_date: function() {
            var date_input = instance.web.auto_str_to_date($("#gantt_improvement_input_date").val());
            var day_input = Math.round((date_input - date_begin)/(1000*60*60*24));
            this.change_scroll(day_input - day_offset, true);
        },
        next_day: function() {
            this.change_scroll(1);
        },
        next_week: function() {
            this.change_scroll(7);
        },
    });
};