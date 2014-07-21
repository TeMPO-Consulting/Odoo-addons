# Gantt Improvement

Features :
* **View** - The gantt graph scrollbar was adapted on the browser size.
* **Moving** - New buttons for jump a day or a week.
* **Search** - New input type date for search a day

## Install
The plugin was configured for Odoo v7.0.
For Odoo v8.0, you must edit the file __openerp__.py :

**Add comment(#) to this lines :**
* 'js': ['static/src/js/gantt.js'], #Odoo V7.0
* 'css': ['static/src/css/gantt.css'], #Odoo V7.0
**Remove comment(#) to this line :**
* #'views/web_gantt.xml', #Odoo V8.0
