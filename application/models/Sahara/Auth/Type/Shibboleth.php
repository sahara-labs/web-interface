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
 * @date 2nd December 2010
 */

/**
 * Sahara authentication link class which
 * Enter description here ...
 * @author mdiponio
 *
 */
class Sahara_Auth_SimpleSAML implements Sahara_Auth_Type
{
    /** Targetted identifier OID. */
    const TARGETED_ID = "1";

    /** Home orginzation OID. */
    const HOME_ORG = "2";

    /** Affliation OID. */
    const AFFILIATION = "3";

    /** First name OID. */
    const FIRST_NAME = "4";

    /** Last name OID. */
    const LAST_NAME = "5";

    /** Email address OID. */
    const EMAIL = "6";

    private static $isSimpleSamlSetup = false;

    public function authenticate()
    {

    }

    public function getAuthInfo($property)
    {

    }

    /**
     * Setups up simpleSAMLphp by including its files for auto loading.
     */
    public static function setupSimpleSAML()
    {
        if (!self::$isSimpleSamlSetup)
        {
            $path = Zend_Config::get('auth')->simpleSaml->location;
            if (!$path || !is_dir($path))
            {
                throw new Exception('simpleSAMLphp installation directory is not configured or does not exist.');
            }


        }
    }
}