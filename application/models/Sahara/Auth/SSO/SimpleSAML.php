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
 * @date 3rd March 2011.
 */

/**
 * Signs in using SimpleSAML.
 */
class Sahara_Auth_SSO_SimpleSAML extends Sahara_Auth_SSO
{
    /** @var int Maximum Sahara user name lenght. */
    const NAME_LENGTH = 14;

    /** @var String simpleSAML auth source. */
    private $_simple;

    /** @var Zend_Db_Table shib_users_map table. */
    private $_mappingTable;

    /** @var Zend_Db_Table_Row Mapping record. */
    private $_mapping;

    /** Account attributes. */
    private $_attrs;

    private function _setup()
    {
        if (!($path = $this->_config->simpleSaml->location))
        {
            $this->_logger->error('The location of the simpleSAMLPHP directory is not configured. Set the ' .
                    "'simpleSaml.location' with the location of the simpleSAMLPHP installation directory.");
            throw new Exception('The location of the simpleSAMLPHP directory is not configured.');
        }

        $file = realpath($path . '/lib/_autoload.php');
        if (!is_file($file))
        {
            $this->_logger->error("The configure simpleSAMLPHP installation directory ($path) does not appear to " .
            	    'a valid simpleSAMLPHP installation.');
            throw new Exception("Didn't find simpleSAMLPHP autoloader, check installation path.");
        }

        include_once $file;

        if (!($sp = $this->_config->simpleSaml->authSource))
        {
            $this->_logger->error('simpleSAMLPHP authentication source is not configured. Set ' .
            		'\'simpleSaml.authSource\ with the authentication source.');
            throw new Exception("simpleSAMLPHP authentications source not configured.");
        }

        $this->_simple = new SimpleSAML_Auth_Simple($sp);

        Sahara_Database::getDatabase();
        $this->_mappingTable = new Zend_Db_Table('shib_users_map');
    }

    public function signon()
    {
        $this->_setup();

        /* ====================================================================
         * 1) Trigger SSO authentication. If the user isn't logged in,
         *    simpleSAMLPHP will direct the user to the authentication source.
         * ==================================================================== */
        $this->_simple->requireAuth(array(
            'ReturnTo' => 'http://apollo.eng.uts.edu.au:7070/index/sso' // TODO
        ));

        /* 2) Load attributes. ================================================ */
        $this->_attrs = new Sahara_Auth_SSO_SimpleSAML_ShibAttributes($this->_simple->getAttributes());

        /* ====================================================================
         * 3) Get the users unique token.
         * ==================================================================== */
        $sid = '';
        if ($this->_config->simpleSaml->shib->forceSharedToken)
        {
            /* The ID must be the shared token, fail otherwise. */
            if (!($sid = $this->_attrs->getSharedToken()))
            {
                $this->_logger->error('Unable to obtain shared token for simpleSAMLPHP login. Attribute dump: ' .
                       $this->_attrs->implode());
                return false;
            }
        }
        else if ($this->_config->simpleSaml->shib->forceTargetedID)
        {
            /* The ID must be the targeted ID, fail otherwise. */
            if (!($sid = $this->_attrs->getTargetedID()))
            {
                $this->_logger->error('Unable to obtain targetted ID for simpleSAMLPHP login. Attribute dump: ' .
                        $attrs->implode());
                return false;
            }
        }
        else
        {
            /* Here we first try shared token and fall back to targetted ID.
             * As long as one is valid, we can continue. */
            $sid = $this->_attrs->getSharedToken() ? $this->_attrs->getSharedToken() : $this->_attrs->getTargetedID();
            if (!$sid)
            {
                $this->_logger->error('Unable to obtain either shared token or targeted ID for simpleSAMLPHP login.' .
                        'Attribute dump: ' . $this->_attrs->implode());
                return false;
            }
        }

        /* ====================================================================
         * 4) Check the users have a mapping and if not, generate it.
         * ==================================================================== */
        $this->_mapping = $this->_mappingTable->fetchRow($this->_mappingTable->select()->where('tid = ?', $sid));
        if (!$this->_mapping)
        {
            $this->_logger->info("First sign in of SSO user with ID sid so going to generate an account for them.");
            $this->_firstTimeSetup($sid);
        }

        return (bool) $this->_mapping;
    }

    /**
     * Does first time setup of the user.
     *
     * @param String sid Either the shared token or targeted ID of the user
     */
    private function _firstTimeSetup($sid)
    {
        /* Generate user name. */
        $useSid = false;

        list ($homeOrg, $junk) = explode('.', $this->_attrs->getOrginisation());
        if ($homeOrg)
        {
            /* Only using first three letters of org. */
            if (strlen($homeOrg) > 3) $homeOrg = substr($homeOrg, 0, 3);
        }
        else $this->_logger->info("Home orginisation was not found, so not using is Sahara user name generation.");

        $fname = $this->_attrs->getFirstname();
        $lname = $this->_attrs->getLastname();
        if (!$fname || !$lname)
        {
            $this->_logger->info("First name ($fname) and last name ($lname) combination was not valid for  " .
                	'Sahara user name generation. Falling back to display name.');
            list($fname, $lname) = explode(' ', $this->_attrs->getDisplayName(), 2);
            if (!$fname || !$lname)
            {
                $this->logger->info('Display name (' . $this->_attrs->getDisplayName() . ') was not valid for ' .
                		"Sahara user name generation. Falling back to token ($sid).");
                $useSid = true;
            }
        }

        if ($useSid)
        {
            $name = $sid;
        }
        else
        {
            $name = ($homeOrg ? $homeOrg . '.' : '') . $fname . '.' . $lname;
        }

        /* Fix max length. */
        if (strlen($name) > self::NAME_LENGTH)  $name = substr($name, 0, self::NAME_LENGTH);

        /* Sanitise special characters. */
        $chrs = str_split($name);
        $name = '';
        foreach (str_split($name) as $c);
        {
            $as = ord($c);
            if (48 <= $as && $as <= 57 || 65 <= $as && $as <= 90 || 97 <= $as && $as <= 122)
            {
                $name .= $c;
            }
        }

        /* Make sure it is unique. */
        $db = Sahara_Database::getDatabase();
        $ns = $db->quote($this->_config->institution);

        $num = $db->fetchOne("SELECT count() FROM users WHERE namespace=$ns AND name=" . $db->quote($name));
        if ($num > 0)
        {
            $suf = 0;
            while ($num > 0)
            {
                $num = $db->fetchOne("SELECT count() FROM users WHERE namespace=$ns AND name=" .
                        $db->quote($name . $suf++));
            }
            $name .= $suf;
        }

        $this->_mapping = $this->_mappingTable->createRow(array(
            'sid' => $sid,
            'user_name' => $name
        ));

        /* Add other attrs. */
        if ($this->_attrs->getOrginisation()) $this->_mapping->home_org = $this->_attrs->getOrginisation();
        if ($this->_attrs->getAffliation()) $this->_mapping->affliation = $this->_attrs->getAffliation();

        $this->_mapping->save();
    }

    public function getUsername()
    {
        return $this->_mapping ? $this->_mapping : null;
    }

    public function getAuthInfo($property)
    {
            // TODO
    }
}