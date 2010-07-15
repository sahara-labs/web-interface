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
 * @date 14th July 2010
 */

/**
 * Sahara session setup class that creates the users home directory if it
 * doesn't exist. The required configured for this script is:
 * <ul>
 * 	<li>session.homedirectory.script - The location to the script which
 *  creates the users home directories.</li>
 * </ul>
 * <strong>NOTE:</strong>Apache will need permission
 */
class UTS_Auth_Session_HomeDirectory extends Sahara_Auth_Session
{
    public function setup()
    {
        $path = '';
        if ($this->_authType->getAuthType() == 'Ldap')
        {
            $path = $this->_authType->getAuthInfo('homedirectory');
        }

        if (!$path)
        {
            $ldapOpts = $this->_config->ldap->params;
            if ($ldapOpts == null)
            {
                throw new Exception('LDAP options not configured.', 102);
            }

            $ldapOpts = $ldapOpts->toArray();
            $ldapOpts['bindRequiresDn'] = true;
            $ldap = new Zend_Ldap($ldapOpts);

            $entry = $ldap->search('uid=' . $this->_authType->getUsername())->getFirst();
            if (!$entry)
            {
                throw new Exception('User ' . $this->_authType->getUsername() . ' LDAP entry not found to create ' .
                		'their home directory.');
            }

            $path = $entry['homedirectory'];
            if (!$path) throw new Exception('User ' . $this->_authType->getUsername() . ' home directory location ' .
            		'not found.');

            if (is_array($path)) $path = $path[0];
        }

        /* Only create the home directory if the path doesn't exist. */
        if (is_dir($path)) return;

        /* Canonicalize path. */
        $path = realpath($path);

        /* Run the home directory creation script. */
        $script = $this->_config->session->homedirectory->script;
        if (!$script) throw new Exception('Home directory creation script not configured.', 108);

        if (!($script = realpath($script) && is_executable($script))
        {
            throw new Exception('Home directory creation does not exist or is not executable.', 108);
        }

        $command = "$script " . escapeshellarg($this->_authType()->getUsername()) . ' ' . escapeshellarg($path);
        exec($command);
    }
}