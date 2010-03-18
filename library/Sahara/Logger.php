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
 * @date 18th March 2010
 */

class Sahara_Logger
{
    /** @var Zend_Log Underlying Zend logger instance. */
    private $_zLogger;

    /** @var Sahara_Logger Logger instance. */
    private static $_instance;

    private function __construct()
    {
        $config = Zend_Registry::get('config');

        /* Set up a stream logger to a file. */
        if ($config->logger->filename == null)
        {
            $writer = new Zend_Log_Writer_Stream('php://output');
        }
        else
        {
            $writer = new Zend_Log_Writer_Stream($config->logger->filename);
        }

        switch ($config->logger->level)
        {
            case "FATAL":
                $writer->addFilter(Zend_Log::CRIT);
                break;
            case "ERROR":
                $writer->addFilter(Zend_Log::ERR);
                break;
            case "WARN":
                $writer->addFilter(Zend_Log::WARN);
                break;
            case "INFO":
                $writer->addFilter(Zend_Log::INFO);
                break;
            case "DEBUG":
                $writer->addFilter(Zend_Log::DEBUG);
                break;
            default:
                $writer->addFilter(Zend_Log::WARN);
                break;
        }

        $this->_zLogger = new Zend_Log($writer);
    }

    /**
     * Logs a fatal message
     *
     * @param String $message fatal message
     */
    public function fatal($message)
    {
        $this->_zLogger->log($message, Zend_Log::ALERT);
    }

    /**
     * Logs an error message.
     *
     * @param String $message error message
     */
    public function error($message)
    {
        $this->_zLogger->log($message, Zend_Log::ERR);
    }

    /**
     * Logs a warning message.
     *
     * @param String $message warning message
     */
    public function warn($message)
    {
        $this->_zLogger->log($message, Zend_Log::WARN);
    }

    /**
     * Logs a informational message.
     *
     * @param String $message info message
     */
    public function info($message)
    {
        $this->_zLogger->log($message, Zend_Log::INFO);
    }

    /**
     * Logs a debug message.
     *
     * @param String $message debug message
     */
    public function debug($message)
    {
        $this->_zLogger->log($message, Zend_Log::DEBUG);
    }

    /**
     * Gets a logger instance.
     *
     * @return Sahara_Logger instance
     */
    public static function getInstance()
    {
        if (self::$_instance == null)
        {
            self::$_instance = new Sahara_Logger();
        }

        return self::$_instance;
    }
}