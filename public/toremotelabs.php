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
 * @date 22nd July 2014
 */

/******************************************************************************
 * This script redirects a user to a Sahara based remote laboratory with      *
 * Moodle authentication and authorisation, so they that the user is          *
 * automatically authenticated and authorised and optionally added to a rig   *
 * queue. It must be installed on the Moodle domain as it uses the Moodle     *
 * session cookie to determine the logged in user to forward.                 *
 ******************************************************************************/

$conf = (object) array(
    /* Moodle database configuration. */
    'database' => (object) array(
        /* Hostname of database server. */
        'host'     => '127.0.0.1',
        /* Moodle database name. */
        'dbname'   => 'moodle',
        /* Database login username. */
        'username' => 'root',
        /* Database login password. */
        'password' => 'rootpasswd',
        /* Moodle database table name prefix. */
        'prefix'   => 'mdl_',
    ),

    /* Path the private key to encryt the SSO payload. This file must be
     * web server readable. */
    'key' => '',

    /* Pass phrase remote labs expects. */
    'passphrase' => 'abc123',

    /* Base URL of Sahara remotelabs. */
    'toremotelabs' => 'http://192.168.56.1',

    /* URL to the Moodle front page. */
    'tomoodle' => 'http://192.168.56.101/moodle',

    /* Moodle session configuration. */
    'session' => (object) array(
        /* Cookie used to store session identifer. */
        'cookie' => 'MoodleSession',
        /* Moodle session timeout in seconds. */
        'timeout' => 7200,
    )
);

/* --- 1. Read session cookie. */
if (!(array_key_exists($conf->session->cookie, $_COOKIE) && $sid = $_COOKIE[$conf->session->cookie]))
{
    /* Moodle session cookie not found so the user probably doesn't have a valid
     * session so we will direct them back to the Moodle front page. */
    redirectTo($conf->tomoodle);
}

/* --- 2. Determine username of logged in user. */
$db = new PDO('mysql:host=' . $conf->database->host . ';dbname=' . $conf->database->dbname,
        $conf->database->username, $conf->database->password);

$stm = $db->query('SELECT us.username FROM ' . $conf->database->prefix . 'user AS us ' .
               'JOIN ' . $conf->database->prefix . 'sessions AS ses ON ses.userid = us.id ' .
               'WHERE ' .
                  'ses.sid = ' . $db->quote($sid) .  // Session must be from user
                  ' AND ses.state = 0'  .             // State must be 0, according to Moodle database_session class
                  ' AND ses.timemodified < ' . (time() + $conf->session->timeout)); // Session cannot be expired

if (!$stm)
{
    /* Some error has occured, display error. */
    echo 'System error, please contact the site admin and quote: ' . implode(' ', $db->errorInfo());
    die;
}

$res = $stm->fetchAll();
if (count($res) == 0)
{
    /* Session does not exist or is no longer valid. */
    redirectTo($conf->tomoodle);
}

/* --- 3. Generate payload. */
$payload = 'UN:  '  . $res[0]['username'] . ' '
           'TS: ' . time() . ' ' .
           'PP: ' . $conf->passphrase . ' ';



/* --- 4. Encrypt payload. */

/* --- 5. Base64 to make payload 8-bit clean. */

/* --- 6. Send redirect to remotelabs. */


/**
 * Redirects the user to the URL with the specified get params.
 *
 * @param {string} $url URL to redirect to
 * @param {assoc} $params GET parameters to include
 */
function redirectTo($url, $params = false)
{
    if ($params)
    {
        $url .= '?';
        $first = true;
        foreach ($params as $key => $val)
        {
            if ($first) $first = false;
            else $url .= '&';

            $url .= $key . '=' . urlencode($val);
        }
    }

    //header("Location: $url");
    echo "Redirecting to $url";
    die;
}

