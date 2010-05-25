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
 * @date  18th March 2010
 * 
 * @author Herbert Yeung
 * @date  25th May 2010
 * Modification: Added SOAP interface to access SchedServer-LabConnector bundle
 */

/**
 * Class to call SOAP methods for SAHARA services.
 */
class Sahara_Soap
{
    /** The bundle containing the Permissions SOAP interface in the Scheduling Server. */
    const PERMISSIONS_SERVICE_BUNDLE = 'SchedulingServer-Permissions';

    /** The bundle containing the Queuer SOAP interface in the Scheduling Server. */
    const QUEUER_SERVICE_BUNDLE = 'SchedulingServer-Queuer';

    /** The bundle containing the Session SOAP interface in the Scheduling Server. */
    const SESSION_SERVICE_BUNDLE = 'SchedulingServer-Session';
    
    /** The bundle containing the LabConnector SOAP interface in the Scheduling Server. */
    const LABCONNECTOR_SERVICE_BUNDLE = 'SchedulingServer-LabConnector';
    
    /** The SOAP client which points to the SOAP service. */
    protected $_client;

    /** The location to the WSDL. */
    protected $_wsdl;

    /**
     * Creates a SOAP client and gets the WSDL from the specified URI.
     *
     * @param string $uri URI to the WSDL file
     * @throws @throws Exception if failed contacting Scheduling Server
     */
    public function __construct($uri)
    {
        $this->_wsdl = $uri;

        $opts = array();

        /* Load whether to cache WSDL. */
        $cache = $config = Zend_Registry::get('config')->SOAP->get('cacheWSDL', TRUE);
        if ($cache == FALSE || strcasecmp($cache, 'false')  == 0)
        {
            ini_set('soap.wsdl_cache_enabled', WSDL_CACHE_NONE);
        }

        $this->_client = new Zend_Soap_Client($this->_wsdl, $opts);
    }

    /**
     * Creates a Scheduling Server SOAP client for the specified end point and
     * optionally prefix. The end point is the name of the service
     * (e.g. 'Permissions') and the prefix is generally the symbolic name
     * of the bundle that exports the service.
     * <br />
     * The hostname and port of the Scheduling Server is loaded from the
     * 'SchedulingServer.hostname' and SchedulingServer.port' configuration
     * properties.
     *
     * @param string $endPoint service endpoint
     * @param string $prefix (optional) prefix to generate the URL (between the end of
     *        		the hostname:port and the Axis2 'services/endpoint' URL portion
     * @return Sahara_Soap instance
     * @throws Exception if failed contacting Scheduling Server
     */
    public static function createSchedServerClient($endPoint, $prefix = null)
    {
        $config = Zend_Registry::get('config');

        /* URL to connect to the service. */
        $uri = 'http://' . $config->SchedulingServer->hostname . ':' . $config->SchedulingServer->port . '/';
        /* Append the prefix, for the Scheduling Server this is generally the symbolic name of the bundle
         * hosting the service (e.g. SchedulingServer-Permissions). */
        if ($prefix != null) $uri .= $prefix . '/';
        /* Append 'services' for Axis. */
        $uri .= 'services/';
        /* Append end point (e.g. 'Permissions'). */
        $uri .= $endPoint;
        /* Append a request for a WSDL file. */
        $uri .= '?wsdl';

        return new Sahara_Soap($uri);
    }

    /**
     * Gets a Sahara_Soap instance which points to the Permissions interface
     * of the Scheduling Server.
     *
     * @return Sahara_Soap instance
     * @throws Exception if failed contacting Scheduling Server
     */
    public static function getSchedServerPermissionsClient()
    {
        if (!Zend_Registry::isRegistered(self::PERMISSIONS_SERVICE_BUNDLE))
        {
            Zend_Registry::set(self::PERMISSIONS_SERVICE_BUNDLE,
                    self::createSchedServerClient('Permissions', self::PERMISSIONS_SERVICE_BUNDLE));
        }
        return Zend_Registry::get(self::PERMISSIONS_SERVICE_BUNDLE);
    }

    /**
     * Gets a Sahara_Soap instance which points to the Queuer interface of
     * the Scheduling Server.
     *
     * @return Sahara_Soap instance
     * @throws Exception if failed contacting Scheduling Server
     */
    public static function getSchedServerQueuerClient()
    {
        if (!Zend_Registry::isRegistered(self::QUEUER_SERVICE_BUNDLE))
        {
            Zend_Registry::set(self::QUEUER_SERVICE_BUNDLE,
                    self::createSchedServerClient('Queuer', self::QUEUER_SERVICE_BUNDLE));
        }
        return Zend_Registry::get(self::QUEUER_SERVICE_BUNDLE);
    }

    /**
     * Gets a Sahara_Soap instance which points to the Session interface
     * of the Scheduling Server.
     *
     * @return Sahara_Soap instance
     * @throws Exception if failed contacting Scheduling Server
     */
    public static function getSchedServerSessionClient()
    {
        if (!Zend_Registry::isRegistered(self::SESSION_SERVICE_BUNDLE))
        {
            Zend_Registry::set(self::SESSION_SERVICE_BUNDLE,
                    self::createSchedServerClient('Session', self::SESSION_SERVICE_BUNDLE));
        }
        return Zend_Registry::get(self::SESSION_SERVICE_BUNDLE);
    }

    /**
     * Gets a Sahara_Soap instance which points to the LabConnector interface
     * of the Scheduling Server.
     *
     * @return Sahara_Soap instance
     * @throws Exception if failed contacting Scheduling Server
     */
    public static function getSchedServerLabConnectorClient()
    {
        if (!Zend_Registry::isRegistered(self::LABCONNECTOR_SERVICE_BUNDLE))
        {
            Zend_Registry::set(self::LABCONNECTOR_SERVICE_BUNDLE,
                    self::createSchedServerClient('LabConnector', self::LABCONNECTOR_SERVICE_BUNDLE));
        }
        return Zend_Registry::get(self::LABCONNECTOR_SERVICE_BUNDLE);
    }


    /**
     * Calls a SOAP operation on the SOAP client.
     *
     * @param String $name name of the operation
     * @param array $params operation parameters
     * @return mixed
     */
    public function __call($name, $params)
    {
        return $this->_client->__call($name, $params);
    }

    /**
     * Gets the WSDL location.
     *
     * @return string wsdl location
     */
    public function getWsdlLocation()
    {
        return $this->_wsdl;
    }
}
