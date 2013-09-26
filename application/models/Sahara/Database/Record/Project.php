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
 * @date 4th Janurary 2013
 */

class Sahara_Database_Record_Project extends Sahara_Database_Record
{
    /** @var String Name of database table. */
    protected $_name = 'project';

    /** @var array Relationship information for joined tables. */
    protected $_relationships = array(
        'metadata' => array(
            'table' => 'project_metadata',
            'entity' => 'ProjectMetadata',
            'join' => 'foreign',
            'foreign_key' => 'project_id'
        ),
        'user' => array(
            'table' => 'users',
            'entity' => 'User',
            'join' => 'local',
            'foreign_key' => 'users_id'
        ),
        'userClass' => array(
            'table' => 'user_class',
            'entity' => 'UserClass',
            'join' => 'local',
            'foreign_key' => 'user_class_id'
        ),
        'collections' => array(
            'table' => 'collection',
            'entity' => 'Collection',
            'join' => 'foreign',
            'foreign_key' => 'project_id'
         )
    );

    /** @var array List of previously loaded sessions. */
    private $_sessions = null;

    /**
     * Gets value of the specified metadata type. If the type has no
     * value NULL is returned.
     *
     * @param Sahara_Database_Record_ProjectMetadataType $type metadata type
     * @return Sahara_Database_Record_ProjectMetadata | NULL metadata type
     */
    public function getMetadata($type)
    {
        foreach ($this->metadata as $metadata)
        {
            if ($type->equals($metadata->type)) return $metadata;
        }

        return NULL;
    }

    /**
     * Gets the list of sessions that were generated from this project.
     *
     * @return array list of session records
     */
    public function getSessions()
    {
        if ($this->_sessions !== null) return $this->_sessions;

        $sql = 'SELECT ses.* FROM session AS ses ' .
                    'JOIN resource_permission AS rp ON ses.resource_permission_id = rp.id ' .
                    'JOIN user_class AS uc ON rp.user_class_id = uc.id ' .

               'WHERE ses.user_id = ' . $this->users_id .
               ' AND uc.id = ' . $this->user_class_id .
               ' AND ses.assignment_time > "' . self::_convertForSQL($this->publish_time) . '"' .
               ' AND ses.id NOT IN ( SELECT session_id FROM collection_sessions )';

        $qu = $this->_db->prepare($sql);
        if (!$qu->execute())
        {
            /* An error occurred executing the statement. */
            throw new Sahara_Database_Exception($qu);
        }

        $this->_sessions = array();
        if ($qu->rowCount())
        {
            foreach ($qu->fetchAll() as $r)
            {
                $ses = new Sahara_Database_Record_Session($r);
                array_push($this->_sessions, $ses);
            }
        }

        return $this->_sessions;
    }
}