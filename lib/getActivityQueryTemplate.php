--
--  @ description: MAV SQL Query Template for getActivity.php
--  @ project: MAV
--  @ komodotemplate: 
--  @ author: Damien Clark <damo.clarky@gmail.com>
--  @ date: 9th Oct 2013

select
<?php if($queryData['activityType'] == 'C'): ?>
l.id
<?php elseif($queryData['activityType'] == 'S'): ?> --If select count of students
distinct u.id
<?php endif; ?>
-------------------------
--Default tables
from m_log l, m_role r,m_role_assignments ra,m_context con,m_user u, m_course c
-------------------------
<?php if(array_key_exists('selectedGroups',$queryData)): ?> --If Groups selected
, m_groups g, m_groups_members gm
<?php endif; ?>
-------------------------
--Limit results to students only (no staff)
where
con.contextlevel = 50
and con.id = ra.contextid
and r.id = ra.roleid
and ra.userid = u.id
and r.archetype = 'student'
and con.instanceid = c.id
and l.userid = u.id
and l.course = c.id
-------------------------
<?php if(array_key_exists('selectedGroups',$queryData)): ?> --If Groups selected limit to those
and u.id = gm.userid
and gm.groupid in
(
<?php echo implode(',',$queryData['selectedGroups']); ?>
) --Comma sep list of ids
and gm.groupid = g.id and g.courseid = c.id
<?php endif; ?>
-------------------------
<?php if(array_key_exists('selectedStudent',$queryData)): ?> --If a student selected limit to just that student
and u.id = l.userid
and u.username = '<?php echo $queryData['selectedStudent']; ?>'
<?php endif; ?>
-------------------------
<?php if(array_key_exists('weeksSelected',$queryData)): ?> --Limit results to particular weeks TODO Not yet implemented
and 
(
--	l.time between 1 and 8 
--	or
--	l.time between 2 and 9
)
<?php endif; ?>
-------------------------
--Get the specifics for the link
and l.module = :module
and l.url = :url
and l.course = :course 
;
