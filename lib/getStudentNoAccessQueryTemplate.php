--
--  @ description: MAV SQL Query Template for getActivity.php
--  @ project: MAV
--  @ komodotemplate: 
--  @ author: Damien Clark <damo.clarky@gmail.com>
--  @ date: 30th May 2014


--Get list of student usernames who have NOT accessed a particular resource
select u.username,u.firstname,u.lastname
from m_role r,m_role_assignments ra,m_context con, m_course c, m_user u
where
con.contextlevel = 50
and con.id = ra.contextid
and r.id = ra.roleid
and ra.userid = u.id
and r.archetype = 'student'
and con.instanceid = c.id
and c.id = :course
except
--Get list of student usernames who have accessed a particular resource
select distinct u.username,u.firstname,u.lastname from m_log_summary ls, m_user u, m_course c
where
  ls.userid = u.id
  and ls.course = c.id
  and ls.url = :url
	and ls.module = :module
	and ls.course = :course
order by lastname,firstname
;
