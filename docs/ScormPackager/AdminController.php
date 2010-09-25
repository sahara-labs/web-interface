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
 * @date 21st February 2010
 */

class AdminController extends Sahara_Controller_Action_Acl
{
    public function indexAction()
    {
        /* ** -- SCORMPACKAGER -- ** */
        $this->view->scormResponse = $this->getRequest()->getParam('scoValue');
    }
    

    /**
	 * Action to handle calls to generate SCOs
	 */
    public function scormAction()
    {
        /* Disable view renderer and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        $params = $this->_request->getPost();
        
        //var_dump($params);
        
        // Use the value from the formset (rigtypescorm) to generate the SCO
        // Place the result in the user's home directory OR default location
        if(isset($params))
        {
            if(isset($params['rigtypescorm']))
                $scoResponse = Sahara_Soap::getSchedServerScormPackagerClient()
                               ->createSCO(array('experimentName' => $params['rigtypescorm']));

            //var_dump($scoResponse);
            //echo $scoResponse->pathSCO;
        }
        
        // Redirect the user back to the orginating page, in this case IndexController of Admin with SCORMPACKAGER response.
        // TODO: This is only a bit of a hack to show status - should display a JavaScript popup with path of generated SCO
        //         OR Error message
        if($scoResponse->pathSCO == "NON EXISTENT RIGTYPE - SCORM WEB SERVICE ERROR")
            $this->_redirectTo('index', 'admin', array('scoValue' => "Error"));
        else
            $this->_redirectTo('index', 'admin', array('scoValue' => "Success"));
    }
}
