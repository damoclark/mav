

# MAV #

Moodle Activity Viewer is an open-source Greasemonkey user script that visualises student activity within the Moodle LMS.  It does this not with tables or graphs, but instead using a heat map - colouring links lighter or darker according to how often they are accessed as illustrated below.

![MAV Image](http://damosworld.files.wordpress.com/2013/08/course1_1.png?w=468&h=341)

The heat map can represent a range of usage information including

* Total number of students to have clicked on a link
* Number of clicks on a link

These representations can be shown for all students, selected Moodle groups of students, and individual students.

## Requirements ##

MAV works only with the [Firefox](http://www.firefox.com) web browser at this time.

The following is required to make use of MAV:

* Greasemonkey Firefox Addon
* A webserver (e.g. Apache) to install the web-service component of MAV
   To generate the heat map MAV communicates with this web service to get the usage information.
* Access to the Moodle DB (or a copy) by the MAV web-service
   The web service has to query a database to get the usage information. It’s currently written to use an aggregated table calculated from the Moodle database.
* A little patience, as this is still emerging and experimental software

## Installation ##

MAV was written for use at CQUniversity Australia.  Installing MAV for users at your institution will require a little effort on your part. It is advised to contact the creator, [Damien Clark](mailto:damo.clarky@gmail.com) for assistance.  An installation guide will be made available soon.

## A quick tour of the features ##

* Generate heatmaps according to the number of clicks on each link, or the number of individual students who clicked each link
* The heatmaps can be shown on any Moodle page (such as Course Home, Discussion Forums, Moodle Pages, Moodle Books, Blackboard Collaborate Recordings, and so on)
* The results can be filtered by Moodle groups (e.g. show only Distance students)
* When used with CQUniversity's Early Alerts Student Indicators (EASI) System, you can see heatmaps of individual student activity.
* At the click of a button, identify students who have and haven't accessed resources and activities directly within the page
* Optionally visualise results by font size (think Wordle or tag cloud) instead of changing colours as an accessibility option for colour-blindness

## Further Information ##

A blog post - [The Moodle Activity Viewer (MAV) - Heatmaps of Student Activity](http://damosworld.wordpress.com/2013/08/30/the-moodle-activity-viewer-mav-heatmaps-of-student-activity/) provides further information about MAV.

## Licence ##

MAV is licenced under the terms of the GPLv2.
