--
--  @ description: MAV SQL Query Template for getActivity.php
--  @ project: MAV
--  @ komodotemplate: 
--  @ author: Damien Clark <damo.clarky@gmail.com>
--  @ date: 9th Oct 2013

select
<?php if($queryData['activityType'] == 'C'): ?> --If select count of clicks
sum(ls.clicks) as total
<?php elseif($queryData['activityType'] == 'S'): ?> --If select count of students
count(distinct ls.userid) as total
<?php endif; ?>
-------------------------
--Default tables
from m_log_summary ls
-------------------------
<?php if(array_key_exists('selectedStudent',$queryData)): ?> --If a student selected limit to just that student
, m_user u
<?php endif; ?>
-------------------------
<?php if(array_key_exists('selectedGroups',$queryData)): ?> --If Groups selected
, m_groups g, m_groups_members gm
<?php endif; ?>
-------------------------
--Get the specifics for the link
where
ls.module = :module
and ls.url = :url
and ls.course = :course 
-------------------------
<?php if(array_key_exists('selectedGroups',$queryData)): ?> --If Groups selected
--If Groups selected limit to those
and ls.userid = gm.userid
and gm.groupid in
(
<?php echo implode(',',$queryData['selectedGroups']); ?>
) --Comma sep list of ids
and gm.groupid = g.id and g.courseid = ls.course
<?php endif; ?>
-------------------------
<?php if(array_key_exists('selectedStudent',$queryData)): ?> --If a student selected limit to just that student
and u.id = ls.userid
and u.username = '<?php echo $queryData['selectedStudent']; ?>'
<?php endif; ?>
;
