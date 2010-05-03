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
 * @date 5th April 2010
 */

/**
 * Renders camera plugins for the session webpages.
 */
class Sahara_Session_Element_Cameras extends Sahara_Session_Element
{
    /** @var array Camera configuration. */
    private $_cameraConfig;

    /** @var array Name of Format types. */
    private $_formats = array(
        'off'  => 'Camera Off',
        'jpeg' => 'JPEG Images',
        'mms'  => 'Windows Media Player',
        'mmsh' => 'VLC Media Player'
    );

    public function __construct($rig)
    {
        parent::__construct($rig);

        /* Load in any other format descriptions. */
        $descs =  $this->_config->cameradesc;
        if (!is_null($descs))
        {
            $this->_formats = array_merge($this->_formats, $descs->toArray());
        }
    }

    /**
     * Loads the details of the rig's cameras.
     */
    public function init()
    {
        if (!($num = $this->_getRigAttribute('Number_of_Cameras')))
        {
            $this->_logger->warn("Unable to determine number of cameras ('WI_Camera_Number' property). Ensure this " .
                    'property exists and contains the correct number of cameras.');
            return;
        }

        $this->_cameraConfig = array();
        for ($i = 1; $i <= $num; $i++)
        {
            $camConf = $this->_getRigAttribute("Camera_$i");
            if (!$camConf)
            {
                $this->_logger->warn("Unable to load camera configuration for camera number $i, it will not be renderd.");
                continue;
            }

            $camera = array();
            foreach (explode(',', $camConf) as $p)
            {
                list($key, $val) = explode('=', $p, 2);
                $key = strtoupper(trim($key));
                $val = trim($val);
                switch ($key)
                {
                    case 'SIZE':
                        list($width, $height) = explode('x', $val);
                        $camera['width'] = $width;
                        $camera['height'] = $height;
                        break;
                    case 'FORMAT':
                        $camera['url'] = array();
                        foreach (explode(';', $val) as $f) $camera['url'][$f] = '';
                        break;
                    default:
                        $camera[$key] = $val;
                }
            }

            /* Generate the camera URL based on the configured format. */
            $vidFormats = $this->_config->camera->toArray();
            foreach ($camera['url'] as $f => $u)
            {
                if (!array_key_exists($f, $vidFormats))
                {
                    $this->_logger->warn("URL format string for format $f not found, this format will not be used.");
                    continue;
                }

                $url = '';
                foreach (explode('<', $vidFormats[$f]) as $p)
                {
                    list($tok, $p) = explode('>', $p, 2);

                    if (array_key_exists($tok, $camera))
                    {
                        $url .= $camera[$tok];
                    }
                    else
                    {
                        $url .= $tok;
                    }
                    $url .= $p;
                }
                $camera['url'][$f] = $url;

                /* Order the camera formats with 'off' first, then 'jpeg', then
                 * rest of the formats in their natural order. */
                $formats = array('off' => $this->_formats['off']);
                $formKeys = array_keys($camera['url']);

                sort($formKeys);
                if (array_search('jpeg', $formKeys) !== false) $formats['jpeg'] = $this->_formats['jpeg'];

                foreach ($formKeys as $k)
                {
                    $formats[$k] = $this->_formats[$k];
                }
                $camera['formats'] = $formats;
            }

            array_push($this->_cameraConfig, $camera);
        }
    }

    public function render()
    {
        $this->init();
        $this->_view->cameras = $this->_cameraConfig;
        $this->_view->formats = $this->_formats;

        $this->_view->headLink()->appendStylesheet($this->_view->baseUrl('css/elements/cameras.css'));
        $this->_view->headScript()->appendFile($this->_view->baseUrl('js/elements/cameras/jquery.media.js'));
        $this->_view->headScript()->appendFile($this->_view->baseUrl('js/elements/cameras/cameras.js'));

        $html = $this->_view->render('Cameras/_cameraPanel.phtml');
        $html .= $this->_view->render('Cameras/_cameras.phtml');
        return $html;
    }
}