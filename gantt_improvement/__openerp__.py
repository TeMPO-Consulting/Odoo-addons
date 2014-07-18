{
    'name': "Gantt Improvement",
    'category': 'Hidden',
    'sequence': 1,
    'description': """
Gantt Improvement
=================
    """,
    'depends': ['web', 'web_gantt'],
    'js': ['static/src/js/gantt.js'],
    'css': ['static/src/css/gantt.css'],
    'qweb': ['static/src/xml/gantt.xml'],
    'data': ['static/src/xml/gantt_config.xml'],
}
