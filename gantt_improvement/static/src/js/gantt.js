/*---------------------------------------------------------
 * OpenERP gantt_improvement
 *---------------------------------------------------------*/
openerp.gantt_improvement = function (instance) {
    var _t = instance.web._t,
       _lt = instance.web._lt;
    var QWeb = instance.web.qweb;
    var date_begin = null;
    var date_end = null;
    var day_today = 0;
    var day_end = 0;
    var day_offset = 0;
    var gantt_tasks = null;
    var last_move_task = null;
    var gantt_loaded = false;

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
            'click .oe_gantt_button_create' : 'on_task_create',
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
        load_gantt: function(fields_view_get, fields_get) {
            var self = this;
            this.fields_view = fields_view_get;
            this.$el.addClass(this.fields_view.arch.attrs['class']);

            return self.alive(new instance.web.Model(this.dataset.model)
            .call('fields_get')).then(function (fields) {
                self.fields = fields;
                self.has_been_loaded.resolve();
            });

        },
        on_data_loaded_2: function(tasks, group_bys) {
            var self = this;
            var model = new instance.web.Model(this.dataset.model).query().all().then(function(result) {
                self.on_data_loaded_3(result, group_bys);
            });
        },
        on_data_loaded_3: function(tasks, group_bys) {
            $(".oe_gantt").html("");
            var self = this;
            var projects = [];
            gantt_tasks = [];
            date_begin = null;
            date_end = null;
            day_today = 0;
            day_end = 0;  

            for (var i in tasks) {
                if (tasks[i].date_end != false && tasks[i].date_end != undefined && tasks[i].date_start != false && tasks[i].date_start != undefined) {
                    gantt_tasks[tasks[i]['id']] = tasks[i];
                    var tasks_parent_id = i;
                    var tasks_parent_name = 'task'+i;

                    if (tasks[i][group_bys] != undefined) {
                        tasks_parent_id = tasks[i][group_bys][0];
                        tasks_parent_name = tasks[i][group_bys][1];
                    }
                    
                    if (projects[tasks_parent_id] == undefined) {
                        projects[tasks_parent_id] = [];
                        projects[tasks_parent_id]['id'] = tasks_parent_id;
                        projects[tasks_parent_id]['name'] = tasks_parent_name;
                        projects[tasks_parent_id]['tasks'] = [];
                        projects[tasks_parent_id]['date_start'] = tasks[i]['date_start'];
                        projects[tasks_parent_id]['date_end'] = tasks[i]['date_end'];
                    }

                    projects[tasks_parent_id]['tasks'].push(tasks[i]);
                    if (projects[tasks_parent_id]['date_start'] < tasks[i]['date_start'])
                        projects[tasks_parent_id]['date_start'] = tasks[i]['date_start']
                    if (projects[tasks_parent_id]['date_end'] > tasks[i]['date_end'])
                        projects[tasks_parent_id]['date_end'] = tasks[i]['date_end']
                    if (date_end == null || date_end < tasks[i].date_end)
                         date_end = tasks[i].date_end;
                    if (date_begin == null || date_begin > tasks[i].date_start)
                        date_begin = tasks[i].date_start;
                }
            }
            date_begin = instance.web.auto_str_to_date(date_begin);
            date_end = instance.web.auto_str_to_date(date_end);
            day_end = Math.round((date_end - date_begin)/(1000*60*60*24));
            day_today = Math.round((new Date() - date_begin)/(1000*60*60*24));

            var data = [];
            var links = [];
            for (var i in projects) {
                var currentTask = {};
                currentTask.id = "proj"+projects[i]['id'];
                currentTask.text = (projects[i]['name']);
                currentTask.open = true;

                data.push(currentTask);

                for (var x in projects[i]['tasks']) {
                    links.push({
                        'id': projects[i]['tasks'][x]['id'],
                        'source': ("proj"+projects[i]['id']),
                        'target': projects[i]['tasks'][x]['id'],
                        'type': 1,
                    });
                    if (projects[i]['tasks'][x]['next_phase_ids'] != undefined) {
                        if (projects[i]['tasks'][x]['next_phase_ids'][0] != undefined) {
                            links.push({
                                'id': projects[i]['tasks'][x]['id']+"next",
                                'source': projects[i]['tasks'][x]['id'],
                                'target': projects[i]['tasks'][x]['next_phase_ids'][0],
                                'type': 0,
                            });
                        }
                    }

                    var currentTask = {};
                    currentTask.id = projects[i]['tasks'][x]['id'];
                    currentTask.text = (projects[i]['tasks'][x]['name']);
                    var d1 = instance.web.auto_str_to_date(projects[i]['tasks'][x]['date_start']);
                    var d2 = instance.web.auto_str_to_date(projects[i]['tasks'][x]['date_end']);
                    var utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
                    var utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
                    var duration = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
                        duration += 1;
                    var start = d1.getDate()+'-'+(d1.getMonth() + 1)+"-"+d1.getFullYear();
                    currentTask.start_date = start;
                    currentTask.duration = duration;
                    currentTask.order = projects[i]['tasks'][x]['sequence'];
                    currentTask.parent = "proj"+projects[i]['id'];
                    if (projects[i]['tasks'][x]['progress'] != undefined)
                        currentTask.progress = projects[i]['tasks'][x]['progress'];
                    data.push(currentTask);
                }
            }
            var tasks = {'data' : data, 'links' : links};

            if (gantt_loaded)
                gantt.clearAll();

            gantt.config.columns=[
                {name:"text", label:"Task name", tree:true, },
            ];
            gantt.config.details_on_dblclick = false;
            gantt.config.min_column_width = 28;
            gantt.config.grid_width = 200;
            gantt.config.row_height = 20;
            gantt.config.date_scale = "%d";
            gantt.config.scale_height = 20*3;
            gantt.config.drag_links = false;
            gantt.config.drag_progress = false;

            var weekScaleTemplate = function(date){
                var dateToStr = gantt.date.date_to_str("%d %M");
                var weekNum = gantt.date.date_to_str("(week %W)");
                var endDate = gantt.date.add(gantt.date.add(date, 1, "week"), -1, "day");
                return dateToStr(date) + " - " + dateToStr(endDate) + " " + weekNum(date);
            };
            gantt.config.subscales = [
                {unit:"month", step:1, date:"%F, %Y"},
                {unit:"week", step:1, template:weekScaleTemplate}
            ];
            if (gantt_loaded == false) {
                gantt.templates.scale_cell_class = function(date){
                    if(date.getDay()==0||date.getDay()==6){
                        return "weekend";
                    }
                };
                gantt.templates.task_cell_class = function(item,date){
                    if(date.getDay()==0||date.getDay()==6){
                        return "weekend"
                    }
                };
                gantt.templates.link_class = function(link){
                    var types = gantt.config.links;
                    switch (link.type){
                        case 0:
                            return "constraint";
                            break;
                    }
                };
                gantt.attachEvent("onTaskClick", function(id, e) {
                    if (gantt_tasks[id] != undefined)
                        self.on_task_display(gantt_tasks[id]);
                });
                gantt.attachEvent("onTaskDrag", function(id, mode, task, original){
                    last_move_task = task;
                });
                gantt.attachEvent("onAfterTaskDrag", function(id, mode, e){
                    self.on_task_changed();
                });
            }
            gantt_loaded = true;
            gantt.init(this.chart_id);
            gantt.parse(tasks);
        },
        previous_week: function() {
            this.scroll_for(-7);
        },
        previous_day: function() {
            this.scroll_for(-1);
        },
        today: function() {
            if ($('.gantt_container').length != 0) {
                this.go_to_date(new Date());
            } else {
                var self = this;
                setTimeout(function(){self.today();}, 300);
            }
            
        },
        scroll_for: function(nb_day) {
            gantt.scrollTo(gantt.getScrollState().x + (nb_day * gantt.config.min_column_width));
        },
        go_to_date: function(date) {
            var date_offset = new Date();
            date_offset.setTime(date.getTime() - ((day_offset - 3) * 24 * 3600 * 1000));
            gantt.showDate(date_offset);
        },
        go_date: function() {
            var date_input = $("#gantt_improvement_input_date").val();
            if (date_input != '') {
                var date = instance.web.auto_str_to_date(date_input);
                this.go_to_date(new Date(date));
            }
        },
        next_day: function() {
            this.scroll_for(1);
        },
        next_week: function() {
            this.scroll_for(7);
        },
        on_task_changed: function() {
            var self = this;
            var itask = gantt_tasks[last_move_task['id']];
            var start = last_move_task['start_date'];
            var duration = last_move_task['duration'] * 24;
            var end = start.clone().addMilliseconds(duration * 60 * 60 * 1000);
            var data = {};
            data[self.fields_view.arch.attrs.date_start] =
                instance.web.auto_date_to_str(start, self.fields[self.fields_view.arch.attrs.date_start].type);
            if (self.fields_view.arch.attrs.date_stop) {
                data[self.fields_view.arch.attrs.date_stop] = 
                    instance.web.auto_date_to_str(end, self.fields[self.fields_view.arch.attrs.date_stop].type);
            } else { // we assume date_duration is defined
                data[self.fields_view.arch.attrs.date_delay] = duration;
            }
            this.dataset.write(itask.id, data);
        },
    });
};