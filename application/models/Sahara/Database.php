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
 * @date 8th July 2010
 */

/**
 * Sets up access to the WI database. The following fields must be set up
 * in configuration:
 * <ul>
 * 	<li>database.adapter - Database server adapter
 * (See http://framework.zend.com/manual/en/zend.db.adapter.html).</li>
 *  <li>database.params.host - Database server address.</li>
 *  <li>database.params.dbname - Database name.</li>
 *  <li>database.params.username - Database username.</li>
 *  <li>database.params.password - Password corresponding to the username.</li>
 * </ul>
 * Optionally, a list of servers can be configured where at runtime is chosen
 * for database operations and if that server later fails, another in the list
 * will be used as a fail over database server. This is useful if database
 * replication exists with the Sahara database. The configuration is:
 * <ul>
 *   <li>database.failover.enabled - Whether database server fail over is
 *   enabled.</li>
 *   <li>database.failover.file - Location to store chosen database server
 *   configuration. This file must be web server writable.</li>
 *   <li>database.failover.params.db&lt;x&gt;.&lt;param&gt; - Database parameter
 *   as in the database.params.<param>, to configure specific properties of the
 *   database server.</li>
 * </ul>
 * The db&ltx&gt; has x incremented per server and each parameter overrides the
 * database.params fields.
 */
class Sahara_Database
{
    /**
     * Gets an instance of the Sahara_Database.
     *
     * @return Zend_Db instance
     * @throws Exception - 100 - Database not configured
     */
    public static function getDatabase()
    {
        if (!Zend_Registry::isRegistered('db'))
        {
            if (!($dbconfig = Zend_Registry::get('config')->database))
            {
                throw new Exception('Database not configured.', 100);
            }

            if (isset($dbconfig->failover) && $dbconfig->failover->enabled)
            {
                if (!($file = $dbconfig->failover->file))
                {
                    throw new Exception('Database fail over configuration file not configured.', 100);
                }

                /* If the database failover file does not exist, a fail over
                 * operation is triggered to choose a database server to
                 * connect to. */
                if (!is_file($dbconfig->failover->file))
                {
                    if (!self::performFailover($dbconfig))
                    {
                        throw new Exception('Failed database fail over, could not find an online server to use.', 100);
                    }
                }
                else
                {
                    if (!($dbconfig = new Zend_Config_Ini($dbconfig->failover->file)))
                    {
                        throw new Exception('Failed to load server from fail over configuration file.', 100);
                    }

                    self::_registerDatabase(Zend_Db::factory($dbconfig));
                }
            }
            else
            {
                self::_registerDatabase(Zend_Db::factory($dbconfig));
            }
        }

        return Zend_Registry::get('db');
    }

    /**
     * Registry database for future database operations.
     *
     * @param Zend_Database $db database to register
     */
    public static function _registerDatabase($db)
    {
        Zend_Db_Table::setDefaultAdapter($db);
        Zend_Registry::set('db', $db);
    }

    /**
     * Perform fail over to choose a database server to connect to.
     *
     * @param Zend_Config $config database configuration fields
     * @return bool whether fail over was able to connect to a server
     */
    public static function performFailover($config = false)
    {
        $logger = Sahara_Logger::getInstance();

        if (!$config && !($config = Zend_Registry::get('config')->database))
            throw new Exception('Database not configured.', 100);

        $excludedId = -1;
        if (file_exists($config->failover->file))
        {
            $ffile = new Zend_Config_Ini($config->failover->file);
            $excludedId = $ffile->dbindex;
        }

        foreach ($config->failover->params as $db => $params)
        {
            /* Check this isn't the excluded database. */
            $id = substr($db, 2);
            if ($id == $excludedId) continue;

            /* Merge configuration fields. */
            $dbconfig = $config->params->toArray();
            foreach ($params as $k => $v) $dbconfig[$k] = $v;

            try
            {
                /* Test connection. */
                $db = Zend_Db::factory($config->adapter, $dbconfig);
                $db->getConnection();

                /* If no exception was thrown connecting to the database, it probably is online
                 * and we can register it. */
                $logger->info('Using fail over database server with index $id for database operations.');
                self::_registerDatabase($db);

                /* Write configuration for future requests. */
                $contents = '; Failover at ' . date(DATE_RFC2822) . "\n" .
                            'adapter = ' . $config->adapter . "\n" .
                            "dbindex = $id\n";
                foreach ($dbconfig as $k => $v) $contents .= "params.$k = $v\n";

                if (!file_put_contents($config->failover->file, $contents, LOCK_EX))
                {
                    throw new Exception('Failed to write fail over file.', 100);
                }

                /* The written configuration file contains the database authentication credentials,
                 * it should have restricted access to only the web server user. */
                if (!chmod($config->failover->file, 0600))
                {
                    $logger->warn('Failed to change permissions of database configuration file \'' .
                            $config->failover->file . '\' to only web server readable and writable, it should be ' .
                            'changed to having this permission.');
                }

                /* Found online database server. */
                return true;
            }
            catch (Zend_Db_Adapter_Exception $ex)
            {
                $logger->warn("Failed to connect to fail over database server with index '$id'. Error is " .
                        $ex->getMessage() . '. Will attempt to connect to any remaining fail over servers.');
            }
        }

        /* No online database servers. */
        return false;
    }
}
