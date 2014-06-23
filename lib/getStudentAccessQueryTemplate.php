--
--  @ description: MAV SQL Query Template for getActivity.php
--  @ project: MAV
--  @ komodotemplate: 
--  @ author: Damien Clark <damo.clarky@gmail.com>
--  @ date: 30th May 2014


--Get list of student usernames who have accessed a particular resource
select distinct u.username,u.firstname,u.lastname from m_log_summary ls, m_user u
where
  ls.userid = u.id
  and ls.url = :url
	and ls.module = :module
	and ls.course = :course
	order by u.lastname,u.firstname
;
