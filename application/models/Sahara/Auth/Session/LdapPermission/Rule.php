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
 * @date 13th July 2010
 */

/**
 * A LDAP permission rule.
 */
class Sahara_Auth_Session_LdapPermission_Rule
{
    /** @var String The filter rule. */
    private $_rule;

    /** @var array Users class list. */
    private $_userClasses;

    public function __construct($rule)
    {
        if (!$rule) throw new Exception("LDAP permission rule cannot be null.", 102);

        list($this->_rule, $cls) = explode('{', $rule, 2);

        $this->_userClasses = array();

        if ($cls && strpos($cls, '}'))
        {
            $cls = substr($cls, 0, -1);
            $this->_userClasses = explode(',', $cls);
        }
        else
        {
            $this->_userClasses = array();
        }
    }

    /**
     * Checks whether this rule applies to the record.
     *
     * @param string $return record to check
     * @param true if applies
     */
    public function applies($record)
    {
        return $this->_match(str_split($this->_rule), $record) ||              // Left pass
               $this->_match(array_reverse(str_split($this->_rule)), $record); // Right pass
    }

    /**
     * Runs a one way pass of the entry.
     *
     * @param syntax $chrs
     * @param record $record
     * @return true if matches
     */
    private function _match($chrs, $record)
    {
        $tok1 = $tok2 = "";
        $equality = $match = $isTok1 = true;

        for ($i = 0; $i < count($chrs); $i++)
        {
            switch ($chrs[$i])
            {
                case '&':
                    if ($this->_checkRecord($record, $tok1, $tok2) xor $equality) return false;
                    $tok1 = "";
                    $tok2 = "";
                    $isTok1 = true;
                    break;
                case '|':
                    if (!($this->_checkRecord($record, $tok1, $tok2) xor $equality)) return true;
                    $tok1 = "";
                    $tok2 = "";
                    $isTok1 = true;
                    break;
                case '=':
                    $equality = true;
                    $isTok1 = false;
                    break;
                case '!':
                    $equality = false;
                    $isTok1 = false;
                    break;
                default:
                    if ($isTok1) $tok1 .= $chrs[$i];
                    else $tok2 .= $chrs[$i];
                    break;
             }
        }

        return !($this->_checkRecord($record, $tok1, $tok2) xor $equality);
    }

    /**
     * Checks whether the record has the specified attribute - value pair.
     *
     * @param assoc array $record record
     * @param string $attr attribute name
     * @param value $val value
     */
    private function _checkRecord($record, $attr, $val)
    {
        if (!array_key_exists($attr, $record)) return false;

        $rVal = $record[$attr];
        return is_array($rVal) ?  in_array($val, $rVal) : $val == $rVal;
    }

    /**
     * Gets the user classes that are applicable for this rule.
     */
    public function getUserClasses()
    {
        return $this->_userClasses;
    }
}