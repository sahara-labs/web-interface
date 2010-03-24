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
 * @date 17th March 2010
 */

/**
 * Boot straps the web application.
 */
class Bootstrap extends Zend_Application_Bootstrap_Bootstrap
{
    /** @var String Application path. */
    protected $_rootDir = APPLICATION_PATH;

    /**
     * Initalises configuration by adding a Zend_Config instance to the registry.
     *
     * @return Zend_Config config instance
     */
    protected function _initConfiguration()
    {
        $config = new Zend_Config_Ini($this->_rootDir . '/configs/config.ini', APPLICATION_ENV);

        /* Add config to the registry. */
        Zend_Registry::set('config', $config);

        return $config;
    }

    /**
     * Initialises the logger.
     *
     * @return unknown_type
     */
    protected function _initLogger()
    {
        require_once 'Sahara/Logger.php'; // The autoloader isn't set up at this point
        Zend_Registry::set('logger', Sahara_Logger::getInstance());
    }

    /**
     * Initialise the Zend autoloader.
     */
    protected function _initAutoLoader()
    {
        $autoloader = Zend_Loader_Autoloader::getInstance();
        $autoloader->registerNamespace('Sahara_');

        $inst = Zend_Registry::get('config')->institution;
        if (is_dir($this->_rootDir . '/../library/' . $inst))
        {
            Zend_Registry::get('logger')->debug("Registering institution namespace '" . $inst . "_'.");
            $autoloader->registerNamespace($inst . '_');
        }
    }

    /**
     * Initialises the view renderer.
     *
     * @return Zend_View view renderer
     */
    protected function _initView()
    {
        /* Create the view. */
        $view = new Zend_View();
        $view->doctype('XHTML1_STRICT');
        $view->setHelperPath($this->_rootDir . '/views/helpers');

        /* Add it to the view renderer. */
        $viewRenderer = Zend_Controller_Action_HelperBroker::getStaticHelper('ViewRenderer');
        $viewRenderer->setView($view);

        Zend_Layout::startMvc(array(
			'layoutPath' => $this->_rootDir . '/views/layouts'
        ));

        return $view;
    }
}

