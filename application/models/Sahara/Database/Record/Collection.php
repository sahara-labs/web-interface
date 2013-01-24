<?php
/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2010, University of Technology, Sydney
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *  * Neither the name of the University of Technology, Sydney nor the names
 *    of its contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author Michael Diponio (mdiponio)
 * @date 17th Janurary 2013
 */

/**
 * Entity for collection records.
 */
class Sahara_Database_Record_Collection extends  Sahara_Database_Record
{
    /** @var String Name of the database table. */
    protected $_name = 'collection';
    
    /** @var array Relationship information for joined tables. */
    protected $_relationships = array(
        'project' => array(
             'table' => 'project',
             'entity' => 'Project',
             'join' => 'local',
             'foreign_key' => 'project_id'
         ),
         'sessions' => array(
             'table' => 'session',
             'entity' => 'Session',
             'join' => 'table',
             'join_table' => 'collection_sessions', 
             'join_table_source' => 'collection_id',
             'join_table_dest' => 'session_id'
          )
    );
    
    /**
     * Returns the start time of this collection. Start time is the time
     * the earliest session of the collection ran.
     * 
     * @return DateTime start time of this collection
     */
    public function getStartTime()
    {
        $start = NULL;
        
        foreach ($this->sessions as $session)
        {
            if ($session->assignment_time && (!$start || $session->assignment_time->diff($start)->invert === 0))
            {
                $start = $session->assignment_time;
            }
        }
        
        return $start;
    }
    
    /**
     * Gets the end time of this project. End time is the time the latest
     * session of the collection finished.
     * 
     * @return DateTime end time of this collection
     */
    public function getEndTime()
    {
        $end = NULL;
        
        foreach ($this->sessions as $session)
        {
            if ($session->removal_time && (!$end || $session->removal_time->diff($end)->invert === 1))
            {
                $end = $session->removal_time;
            }
        }
        
        return $end;
    }
    
    /**
     * Gets the apparatuses used by this collection. The response is an associative 
     * array keyed by rig type names and with values of an array of rig names in that 
     * type.
     * 
     *  @return array rig types and rig names
     */
    public function getApparatuses()
    {
        $apparatuses = array();
        
        foreach ($this->sessions as $session)
        {
            if ($rig = $session->rig)
            {
                if (!array_key_exists($rig->type->name, $apparatuses)) $apparatuses[$rig->type->name] = array();
                array_push($apparatuses[$rig->type->name], $rig->name);
            }
        }
        
        return $apparatuses;
    }
}
