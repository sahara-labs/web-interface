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
 * @date 21st May 2010
 */

class Sahara_Session_Element_FileTransfer extends Sahara_Session_Element
{
    /** @var String Rig Client file transfer controller. */
    const FILE_TRANSFER_CONTROLLER = 'au.edu.labshare.primitive.FileTransferController';

    public function init()
    {
        $fileList = array();

        $list = $this->_performPrimitive(self::FILE_TRANSFER_CONTROLLER, 'listFiles');

        if ($list)
        {
            foreach ($list as $name => $params)
            {
                list($mime, $type, $jk) = explode(';', $params);

                $url = $this->_view->baseUrl() . '/primitive/file/pc/' . self::FILE_TRANSFER_CONTROLLER;
                if ($type == 'binary')
                {
                    /* Binary file, so must use the binary file action and decode as base64. */
                    $url .= '/pa/binaryFile/tf/base64';
                }
                else
                {
                    /* Text file, so must use the text file action. */
                    $url .= '/pa/textFile';
                }

                /* Force file download with the same original name. */
                $url .= "/fn/$name";

                /* Mime type. */
                list($m1, $m2) = explode('/', $mime);
                $url .= "/mime/$m1-$m2";

                /* Name of file to download. */
                $url .= "/filename/$name";
                $fileList[$name] = $url;
            }
        }

        $this->_view->files = $fileList;
    }

    public function render()
    {
        $this->init();
        $this->_view->headLink()->appendStylesheet($this->_view->baseUrl('/css/elements/filetransfer.css'));

        echo $this->_view->render('FileTransfer/_fileTransferPanel.phtml');
    }
}