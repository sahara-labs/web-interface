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
    /** Wild card character. */
    const WILD_CARD = '*';

    /** @private {assoc} Mapping between Moodle course record fields and Sahara
     *  user classes. */
    private $_rules = array(
          'idnumber'   => array(),  // Matching course identifiers
          'shortnname' => array(),  // Matching course short names
          'fullname'   => array()   // Matching course full names
    );

    /** @private {assoc} Mapping between Moodle categories and Sahara user
     *  classes. */
    private $_catRules = array(
          'idnumber' => array(),   // Matching category identifier
          'name'     => array()    // Matching category name
    );

    /** @private {assoc} Loaded categories. */
    private $_categories = array();

    /** @private {string} Moodle database table name prefix. */
    private $_tblPrefix;

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

        $this->_tblPrefix = $this->_config->moodle->database->prefix ? $this->_config->moodle->database->prefix : '';
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

                $enrolment = $this->_authType->getMoodleDatabaseConn()->fetchAll(
                    'SELECT co.shortname, co.fullname, co.idnumber, co.category FROM ' .
                        $this->_tblPrefix . 'course AS co JOIN ' . $this->_tblPrefix . 'enrol AS e ON co.id = e.courseid ' .
                        'JOIN ' . $this->_tblPrefix . 'user_enrolments AS ue ON e.id = ue.enrolid ' .
                        'JOIN ' . $this->_tblPrefix . 'user AS u ON u.id = ue.userid ' .
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
        if (!preg_match('/^\w+=[\w\*]+[\s\w]*\{\w+[,\s\w]*}$/', $rule))
        {
            $this->_logger->warn("Moodle authorisation rule '$rule' is not valid as it does not have the correct " .
                    'format, excluding rule from authorisation decisions.');
            return;
        }

        list ($field, $val, $cl) = preg_split('/[=\{}]+/', $rule);
        $classes = explode(',', $cl);
        switch ($field)
        {
            case 'id':
                $this->_rules['idnumber'][$val] = $classes;
                break;
            case 'short':
                $this->_rules['shortname'][$val] = $classes;
                break;
            case 'full':
                $this->_rules['fullname'][$val] = $classes;
                break;
            case 'cat':
                $this->_catRules['name'][$val] = $classes;
                break;
            case 'catid':
                $this->_catRules['idnumber'][$val] = $classes;
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

        /* Run through enrolment record checks. */
        foreach ($this->_rules as $type => $mapping)
        {
            foreach ($mapping as $pattern => $allowed)
            {
                if ($this->_match($pattern, $enrolment->$type))
                {
                    $classes = array_merge($classes, $allowed);
                }
            }
        }

        if (count($this->_catRules['idnumber']) || count($this->_catRules['name']))
        {
            /* Category rules exist, so we will need to load the category recods
             * for the enrolment. */
            $this->_loadCategoryHierarchy($enrolment->category);

            /* Check all category rules agains the enrolments category hierarchy. */
            foreach ($this->_catRules as $type => $mapping)
            {
                foreach ($mapping as $pattern => $allowed)
                {
                    $cid = $enrolment->category;

                    while ($cid && array_key_exists($cid, $this->_categories))
                    {
                        if ($this->_match($pattern, $this->_categories[$cid]->$type))
                        {
                            $classes = array_merge($classes, $allowed);
                        }

                        $cid = $this->_categories[$cid]->parent;
                    }
                }
            }
        }

        return $classes;
    }

    /**
     * Loads a category, including all parent categories.
     *
     * @param {integer} $id categroy identifier
     */
    private function _loadCategoryHierarchy($id)
    {
        /* Check if category previously loaded. */
        if (array_key_exists($id, $this->_categories)) return;

        $res = $this->_authType->getMoodleDatabaseConn()->fetchAll('SELECT id, name, idnumber, parent FROM ' .
                $this->_tblPrefix . 'course_categories WHERE id = ?', $id);

        /* Category record found. */
        if (count($res))
        {
            $this->_categories[$id] = $res[0];

            /* Load parent categories if they exist. */
            if ($this->_categories[$id]->parent) $this->_loadCategoryHierarchy($this->_categories[$id]->parent);
        }
    }

    /**
     * Attempts to match a value to a pattern. The pattern may be a literal
     * or containing one or more wildcards that specify at that position
     * zero or more characters are expected.
     *
     * @param {string} $pattern that will be matched against
     * @param {string} $value value to match
     */
    private function _match($pattern, $value)
    {
        /* If the pattern is a literal, only equality is a match. */
        if (strpos($pattern, self::WILD_CARD) === FALSE) return $pattern == $value;

        $off = 0;
        foreach (explode(self::WILD_CARD, $pattern) as $sub)
        {
            if (!$sub) continue; // Wild card position
            if (($off = strpos($value, $sub, $off)) === FALSE) return false;
        }

        return true;
    }
}
