{* smarty *}


{*********************************************************
  @ description: MAV SQL Query Template for getActivity.php
  @ project: MAV
  @ komodotemplate: 
  @ author: Damien Clark <damo.clarky@gmail.com>
  @ date: 5th May 2013
**********************************************************}

select
{*----------------------*}
{if $activityType == 'C'} {* If select count of clicks *}
l.id
{elseif $activityType == 'S'} {* If select count of students *}
distinct u.id
{/if}
{*----------------------*}
{* Default tables *}
from m_log l, m_role r,m_role_assignments ra,m_context con,m_user u, m_course c
{*----------------------*}
{if $selectedGroups} {* If Groups selected *}
, m_groups g, m_groups_members gm
{/if}
{*----------------------*}
{* Limit results to students only (no staff) *}
where
con.contextlevel = 50
and con.id = ra.contextid
and r.id = ra.roleid
and ra.userid = u.id
and r.archetype = 'student'
and con.instanceid = c.id
and l.userid = u.id
and l.course = c.id
{*----------------------*}
{if $selectedGroups} {* If Groups selected limit to those *}
and u.id = gm.userid
and gm.groupid in ({$selectedGroups|@implode:', '}) {* Comma sep list of ids *}
and gm.groupid = g.id and g.courseid = c.id
{/if}
{*----------------------*}
{if $weeksSelected} {* Limit results to particular weeks *}
and 
(
--	l.time between 1 and 8 
--	or
--	l.time between 2 and 9
)
{/if}
{*----------------------*}
{* Get the specifics for the link *}
and l.module = :module
and l.url = :url
and l.course = :course 
;
