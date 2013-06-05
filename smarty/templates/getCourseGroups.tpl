{* Smarty *}



{*********************************************************
  @ description: MAV Return HTML for groups in MAV dialog
  @ project: MAV
  @ komodotemplate: 
  @ author: Damien Clark <damo.clarky@gmail.com>
  @ date: 4th May 2013
**********************************************************}

<input type="checkbox" id="MAVgroup_All" value="0"/> All students<br/>
{foreach $groups as $groupId => $groupname}
<input type="checkbox" id="MAVgroup_{$groupId}" checked="checked" value="{$groupId}"/> {$groupname}<br/>
{/foreach}
