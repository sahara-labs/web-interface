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
 * @date 18th July 2014
 */

/**
 * Session setup that uses a Moodle enrolment to courses to determine which
 * Sahara user classes the user should be a member of.
 * <br />
 * The configuration to map enrolment to user class is the form of rules that
 * are in the format 'moodle.authorise.rule[] = <field>=<value>,{<class,class,...}',
 * where field can be:
 * <ul>
 *     <li>id - Course ID number (as specified in Moodle course admin interface).</li>
 *     <li>short - Short name of course.</li>
 *     <li>full - Full name of course.<li>
 * </ul>
 */
class Sahara_Auth_Session_MoodleAuthorise extends Sahara_Auth_Session
{
    /** @private {assoc array} Mapping between course identifiers, short names,
     *  or full names and the Sahara user classses that the member should be
     *  a memeber. */
    private $_rules = array(
          'idnumber' => array(),     // Matching course identifiers
          'shortnname' => array(),  // Match course short names
          'fullname' => array());    // Match course full names

    public function __construct()
    {
        parent::__construct();

        /* Load configuration rules. */
        if ($rules = $this->_config->moodle->authorise_rule)
        {
            if ($rules instanceOf Zend_Config)
            {
                foreach ($rules->toArray() as $r) $this->_parseRule($r);
            }
            else if (is_array($rules))
            {
                foreach ($rules as $r) $this->_parseRule($r);
            }
            else $this->_parseRule($rules);
        }
    }

    /**
     * (non-PHPdoc)
     * @see models/Sahara/Auth/Sahara_Auth_Session::setup()
     */
    public function setup()
    {
        /* Check the user actually came from Moodle, if not it is a
         * configuration error, so an error will be thrown to get the
         * admin to fix this. */
        if (!($this->_authType instanceof  Sahara_Auth_Type_Moodle))
        {
            $this->_logger->error('Moodle authorise session setup can only be used with accounts authenticated ' .
                    'off Moodle. This is a configuration error.');
            throw new Exception('Unable to use Moodle authorise if a user\'s account has not been authenticated off ' .
                    'Moodle');
        }

        /* Load the user's Moodle enrolment. */
        $prefix = $this->_config->moodle->database->prefix ? $this->_config->moodle->database->prefix : '';
        $enrolment = $this->_authType->getMoodleDatabaseConn()->fetchAll(
                    'SELECT co.shortname, co.fullname, co.idnumber, co.category FROM ' .
                        $prefix . 'course AS co JOIN ' . $prefix . 'enrol AS e ON co.id = e.courseid ' .
                        'JOIN ' . $prefix . 'user_enrolments AS ue ON e.id = ue.enrolid ' .
                        'JOIN ' . $prefix . 'user AS u ON u.id = ue.userid ' .
                    'WHERE u.username = ? ' .
                        'AND e.status = 0 ' .                                  // Enrolment must be valid
                        'AND ue.status = 0 ' .                                 // User's enrolment must be valid
                        'AND ue.timestart < ' . time() .                       // Must not start in the future
                       ' AND (ue.timeend > ' . time() . ' OR ue.timeend = 0)', // Must not end in the past
                $this->_authType->getMoodleUsername());


        /* Determine the list of classes the user should be a member of. */
        $memberOf = array();
        foreach ($enrolment as $e)
        {
            if (count($classes = $this->_matchEnrolment($e)))
            {
                $memberOf = array_merge($memberOf, $classes);
            }
        }

        /* In case a multiple rules put the user in the same user class. */
        $memberOf = array_unique($memberOf);

        /* Determine what classes the user is already a member of. */
        $db = Sahara_Database::getDatabase();
        $ucRecords = $db->fetchAll(
                'SELECT uc.name, uc.id AS classid, us.id AS userid FROM user_class AS uc ' .
                    'JOIN user_association AS ua ON uc.id = ua.user_class_id ' .
                    'JOIN users AS us ON us.id = ua.users_id ' .
                'WHERE us.name = ?', $this->_authType->getUsername());

        foreach ($ucRecords as $r)
        {
            if (in_array($r['name'], $memberOf))
            {
                /* User is a member of the class they should be a member of. */
                unset($memberOf[array_search($r['name'], $memberOf)]);
            }
            else
            {
                /* User has additional membership that should be removed. */
                $db->query('DELETE FROM user_association WHERE users_id = ? AND user_class_id = ?',
                        array($r['userid'], $r['classid']));
            }
        }

        /* For the remaining memeberships, the user needs to be added. */
        foreach ($memberOf as $m)
        {
            try
            {
                 $db->query('INSERT INTO user_association (users_id, user_class_id) VALUES (' .
                         '(SELECT id FROM users WHERE name = ?),' .
                         '(SELECT id FROM user_class WHERE name = ?)' .
                  ')', array($this->_authType->getUsername(), $m));
            }
            catch (Zend_Db_Statement_Exception $ex)
            {
                if ($ex->getCode() == '23000')
                {
                    /* User class (probably) doesn't exist. */
                    $this->_logger->warn('Failed adding association for user \'' . $this->_authType->getUsername() .
                                '\' to class \'' . $m . '\'. Check the class actually exists.');
                }
                else throw $ex; // Some other error, propogate to error handling.
            }
        }
    }

    /**
     * Parse configured authorisation rules into a structure for easy matching.
     *
     * @param {string} $rule Rule to parse
     */
    private function _parseRule($rule)
    {
        /* Validate the rule matches to correct format. */
        if (!preg_match('/^\w+=\w+[\s\w]*\{\w+[,\s\w]*}$/', $rule))
        {
            $this->_logger->warn("Moodle authorisation rule '$rule' is not valid as it does not have the correct " .
                    'format, excluding rule from authorisation decisions.');
            return;
        }

        list ($field, $val, $cl) = preg_split('/[=\{}]+/', $rule);
        switch ($field)
        {
            case 'id':
                $this->_rules['idnumber'][$val] = explode(',', $cl);
                break;
            case 'short':
                $this->_rules['shortname'][$val] = explode(',', $cl);
                break;
            case 'full':
                $this->_rules['fullname'][$val] = explode(',', $cl);
                break;
            default:
                $this->_logger->warn("Moodle authorisation rule '$rule' is not valid as the subject field '$field' " .
                        'is not id, short, or full. Excluding rule from authorisation decisions.');
                break;
        }
    }

    /**
     * Matches the enrolment with configured authorisation rules and returns
     * the list of user classes that the user should be a member of. This may
     * be an empty if the enrolment matches no rules.
     *
     * @param {assoc array} course a user is enrolled in
     * @return {array} list of user classes the user should be a member of
     */
    private function _matchEnrolment($enrolment)
    {
        $classes = array();

        foreach ($this->_rules as $type => $options)
        {
            if (array_key_exists($enrolment->$type, $options))
            {
                $classes = array_merge($options[$enrolment->$type], $classes);
            }
        }

        return $classes;
    }
}
