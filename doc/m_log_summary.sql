
--The following query is executed on the moodle2 database for MAV
--Create a summary table of the m_log for MAV
create table m_log_summary as
select l.course,l.module,l.url,l.userid,count(l.id) as clicks
from m_log l, m_role r,m_role_assignments ra,m_context con, m_course c
where
con.contextlevel = 50
and con.id = ra.contextid
and r.id = ra.roleid
and ra.userid = l.userid
and r.archetype = 'student'
and con.instanceid = c.id
and l.course = c.id
group by l.course,l.module,l.url,l.userid
;

--The following index is used by MAV for the m_log_summary table
create index m_log_summary_url_ix on m_log_summary (url,course,module,userid);


--The following 2 queries use the m_log_summary table to pull back data on
--an example link in a course

--Get total clicks
select sum(clicks) from m_log_summary
where course = 2018
and url = 'view.php?id=171963'
and module = 'assignment' ;

--Get total distinct users
select count(distinct userid) as counter from m_log_summary
where course = 2018
and url = 'view.php?id=171963'
and module = 'assignment' ;




--The following 2 queries use the m_log table to pull back data on an example
--link in a course (this is the old way - before m_log_summary)
--Get total clicks
select l.id
from m_log l, m_role r,m_role_assignments ra,m_context con,m_user u, m_course c
where
con.contextlevel = 50
and con.id = ra.contextid
and r.id = ra.roleid
and ra.userid = u.id
and r.archetype = 'student'
and con.instanceid = c.id
and l.userid = u.id
and l.course = c.id
and l.module = 'assignment'
and l.url = 'view.php?id=171963' and l.course = 2018 ;

--Get distinct students
select distinct u.id
from m_log l, m_role r,m_role_assignments ra,m_context con,m_user u, m_course c
where
con.contextlevel = 50
and con.id = ra.contextid
and r.id = ra.roleid
and ra.userid = u.id
and r.archetype = 'student'
and con.instanceid = c.id
and l.userid = u.id
and l.course = c.id
and l.module = 'assignment'
and l.url = 'view.php?id=171963' and l.course = 2018 ;
