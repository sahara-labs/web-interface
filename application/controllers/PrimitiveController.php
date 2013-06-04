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
 * @date 6th May 2010
 */

/**
 * Controller for call rig client primitive control.
 */
class PrimitiveController extends Zend_Controller_Action
{
    /** Authentication storage. */
    private $_auth;

    public function init()
    {
        $this->_auth = Zend_Auth::getInstance();
    }

    /**
     * Action to bridge a primitive call to the in session rigclient. The
     * results are returned as a JSON string (either the response object or
     * a Zend fault).
     * <br />
     * The mandatory parameters are:
     * <ul>
     * 	<li> pc | primitiveController => The name of the primitive controller.</li>
     *  <lI> pa | primitiveAction => The name of the action to run on the specified
     *  controller.</li>
     * </ul>
     * Any other provided parameters are used as primitive request parameters.
     * If the primitive call fails, the string 'FAILED' is returned.
     */
    public function jsonAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            echo 'FAILED';
            return;
        }

        /* Set up the correct object model. */
        list($junk, $allocUser) = explode(':', $this->_auth->getIdentity(), 2);
        $request = array(
            'requestor' => $allocUser,
        	'param' => array());
        foreach ($this->_request->getParams() as $key => $val)
        {
            switch ($key)
            {
               case 'pc': // Short hand of primitiveController
               case 'primitiveController':
                   $request['controller'] = $val;
                   break;
               case 'pa': // Short hand of primitiveAction
               case 'primitiveAction':
                   $request['action'] = $val;
                   break;
               case 'controller':
               case 'action':
               case 'module':
                   /* These are Zend request parameters and irrelevant to the
                    * primitive call. */
                   break;
               default:
                  $param = array(
                      'name' => $key,
                      'value' => $val
                  );
                  array_push($request['param'], $param);
                  break;
            }
        }

        try
        {
            $rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
            $response = $rigClient->performPrimitiveControl($request);

            if ($response->success)
            {
                echo $this->view->json($response->result);
            }
            else
            {
                echo 'FAILED ' . $response->error->reason;
            }
        }
        catch (Exception $ex)
        {
            echo 'FAILED';
        }
    }

    /**
     * Action to bridge a primitive call to the in session rigclient. The
     * results are returned as a JSON string (either the response object or
     * a Zend fault).
     * <br />
     * The mandatory parameters are:
     * <ul>
     * 	<li> pc | primitiveController => The name of the primitive controller.</li>
     *  <lI> pa | primitiveAction => The name of the action to run on the specified
     *  controller.</li>
     * </ul>

     * Any other provided parameters are used as primitive request parameters.
     * If the primitive call fails, a JSON string is returned.
     */
    public function mapjsonAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
                'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            echo $this->view->json(array(
                    'success' => false,
                    'errorCode' => -1,
                    'errorReason' => 'User not in session'
            ));
            return;
        }

        /* Set up the correct object model. */
        list($junk, $allocUser) = explode(':', $this->_auth->getIdentity(), 2);
        $request = array(
                'requestor' => $allocUser,
                'param' => array()
        );

        foreach ($this->_request->getParams() as $key => $val)
        {
            switch ($key)
            {
                case 'pc':
                case 'primitiveController':
                    $request['controller'] = $val;
                    break;
                case 'pa':
                case 'primitiveAction':
                    $request['action'] = $val;
                    break;
                case 'rp':
                case 'responseParam':
                    $responseParam = $val;
                    break;

                    /* These are Zend request parameters and irrelevant to the
                     * primitive call. */
                case 'controller':
                case 'action':
                case 'module':
                    break;

                    /* Parameters to provide to primitive call. */
                default:
                    $param = array(
                    'name' => $key,
                    'value' => $val
                    );
                    array_push($request['param'], $param);
                    break;
            }
        }

        try
        {
            $rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
            $response = $rigClient->performPrimitiveControl($request);

            if (!$response->success)
            {
                echo $this->view->json(array(
                    'success' => false,
                    'errorCode' => $response->error->code,
                    'errorReason' => $response->error->reason
                ));
                return;
            }

            /* Return the specified response. */
            $results = array();

            if (is_array($response->result))
            {
                foreach ($response->result as $r)
                {
                    $results[$r->name] = $this->_parseVal($r->value);
                }
            }
            else
            {
                $results[$response->result->name] = $this->_parseVal($response->result->value);
            }

            echo $this->view->json($results);
        }
        catch (Exception $ex)
        {
            echo $this->view->json(array(
                 'success' => false,
                 'errorCode' => -2,
                 'errorReason' => 'SOAP fault communicating with Rig Client'
            ));
        }
    }

    /**
     * Parses the value to turn the string representation so that the
     * value is represented with a more natural type. For example, an
     * integer string is returned as a string.
     *
     * @param String $val value in string
     * @return mixed value in native type
     */
    public function _parseVal($val)
    {
        if      ($val === 'true')  return true;
        else if ($val === 'false') return false;
        else if (is_numeric($val)) return (float)$val;
        else if (preg_match('/^\[.*\]$/', $val))
        {
            $val = substr(substr($val, 0, strlen($val) - 1), 1);
            $res = array();
            foreach (split(',', $val) as $v) array_push($res, $this->_parseVal($v));
            return $res;
        }
        else return $val;
    }

	/**
     * Action to bridge a primitive call to the in session rigclient. If a
     * response parameter name is specified, its value is echoed back. If no
     * response parameter is specifed, all the response paramters are returned
     * in the format:
	 *    name=value,name=value,...
     * <br />
     * The mandatory parameters are:
     * <ul>
     * 	<li>pc | primitiveController => The name of the primitive controller.</li>
     *  <lI>pa | primitiveAction => The name of the action to run on the specified
     *  controller.</li>
     * </ul>
     * The optional parameters are:
     * <ul>
     * 	<li>rp | responseParam => The name of the response pasrameter.</li>
     * </ul>
     * Any other provided parameters are used as primitive request parameters.
     * <br />
     * If the primitive call failed 'FAILED' is returned. If the primitive call succeeded
     * but no response parameters was provided, 'SUCCESS' is returned.
     */
    public function echoAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            echo 'FAILED';
            return;
        }

        /* Set up the correct object model. */
        list($junk, $allocUser) = explode(':', $this->_auth->getIdentity(), 2);
        $request = array(
            'requestor' => $allocUser,
        	'param' => array());

        foreach ($this->_request->getParams() as $key => $val)
        {
            switch ($key)
            {
               case 'pc':
               case 'primitiveController':
                   $request['controller'] = $val;
                   break;
               case 'pa':
               case 'primitiveAction':
                   $request['action'] = $val;
                   break;
               case 'rp':
               case 'responseParam':
                   $responseParam = $val;
                   break;

                   /* These are Zend request parameters and irrelevant to the
                    * primitive call. */
               case 'controller':
               case 'action':
               case 'module':
                   break;

                   /* Parameters to provide to primitive call. */
               default:
                  $param = array(
                      'name' => $key,
                      'value' => $val
                  );
                  array_push($request['param'], $param);
                  break;
            }
        }

        try
        {
            $rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
            $response = $rigClient->performPrimitiveControl($request);

            if (!$response->success)
            {
                echo "FAILED " . $response->error->reason;
                return;
            }
            $response = $response->result;

            /* Return the specified response. */
            if ($responseParam)
            {
                if (isset($response->name) && $response->name == $responseParam)
                {

                    echo $response->value;
                    return;
                }
                else
                {
                    foreach ($response as $r)
                    {
                        if ($r->name == $responseParam)
                        {
                            echo $r->value;
                            return;
                        }
                    }
                }
                echo 'FAILED';
                return;
            }

            /** Return all the response parameters. */
            if (is_null($response))
            {
                echo 'SUCCESS';
                return;
            }

            if (isset($response->name))
            {
                echo $response->value;
                return;
            }

            foreach ($response as $r) $str .= $r->name . '=' . $r->value . ',';
            if (isset($str))
            {
                echo substr($str, 0, strlen($str) - 1);
                return;
            }
            echo 'FAILED';
        }
        catch (Exception $ex)
        {
            echo 'FAILED';
        }
    }

    /**
     * Action to bridge a primitive call to the in session rigclient. If a
     * response parameter name is specified, its value is as a file to download.
     * If no response parameter is specifed, all the response paramters are
     * returned as a file in the format:
	 *    name=value,name=value,...
     * <br />
     * The mandatory parameters are:
     * <ul>
     * 	<li>pc | primitiveController => The name of the primitive controller.</li>
     *  <lI>pa | primitiveAction => The name of the action to run on the specified
     *  controller.</li>
     * </ul>
     * The optional parameters are:
     * <ul>
     * 	<li>rp | responseParam => The name of the response pasrameter.</li>
     *  <li>mime => The mime type of returned file.</li>
     *  <li>fn | filename => The name of file (also forces file downlod)</li>
     *  <li>tf | transform => A transform to apply to the code. The transform
     *  options are:
     *    1) 'base64' - this base64 decodes the return value and should be used
     *    if the response is binary data.</li>
     * </ul>
     * Any other provided parameters are used as primitive request parameters.
     * <br />
     * If the called failed 'FAILED' is returned.
     */
    public function fileAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $mime = $this->_config->primitive->file->mime;

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            echo 'FAILED';
            return;
        }

        /* Set up the correct object model. */
        list($junk, $allocUser) = explode(':', $this->_auth->getIdentity(), 2);
        $request = array(
            'requestor' => $allocUser,
        	'param' => array());

        foreach ($this->_request->getParams() as $key => $val)
        {
            switch ($key)
            {
               case 'pc':
               case 'primitiveController':
                   $request['controller'] = $val;
                   break;
               case 'pa':
               case 'primitiveAction':
                   $request['action'] = $val;
                   break;

               case 'rp':
               case 'responseParam':
                   $responseParam = $val;
                   break;

               /* MIME type of file. */
               case 'mime': // Mime type
                   $mime = implode('/', explode('-', $val, 2));
                   break;

               /* Filename of file (forces download). */
               case 'fn':
               case 'downloadedname':
                   $filename = $val;
                   break;

               /* Transform for string. */
               case 'tf':
               case 'transform':
                   $transform = $val;
                   break;

               /* These are Zend request parameters and irrelevant to the
                * primitive call. */
               case 'controller':
               case 'action':
               case 'module':
                   break;

                   /* Parameters to provide to primitive call. */
               default:
                  $param = array(
                      'name' => $key,
                      'value' => $val
                  );
                  array_push($request['param'], $param);
                  break;
            }
        }

        /* Set header about the response. */
        header("Content-Type: $mime");
        if (isset($filename)) header("Content-disposition: attachment; filename=$filename");

        try
        {
            $rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
            $response = $rigClient->performPrimitiveControl($request);
            if (!$response->success)
            {
                echo "FAILED " . $response->error->reason;
                return;
            }
            $response = $response->result;

            /* Return the specified response. */
            if ($responseParam)
            {
                if (isset($response->name) && $response->name == $responseParam)
                {
                    echo $this->_echoWithTransform($response->value, $transform);
                    return;
                }
                else
                {
                    foreach ($response as $r)
                    {
                        if ($r->name == $responseParam)
                        {
                            echo $this->_echoWithTransform($r->value, $transform);
                            return;
                        }
                    }
                }
                echo 'FAILED';
                return;
            }

            /** Return all the response parameters. */
            if (isset($response->name))
            {
                echo $this->_echoWithTransform($response->value, $transform);
                return;
            }

            foreach ($response as $r) $str .= $r->name . '=' . $r->value . ',';
            if (isset($str))
            {
                echo $this->_echoWithTransform(substr($str, 0, strlen($str) - 1), $transform);
                return;
            }
            echo 'FAILED';
        }
        catch (Exception $ex)
        {
            echo 'FAILED';
        }
    }

    /**
     * Echos the supplied value after optionally applying a transform. The
     * transform options are:
     * <ul>
     * 	<li>base64 - Base 64 decodes the result.
     * </ul>
     *
     * @param String $val value to echo
     * @param String $transform transform to apply
     */
    private function _echoWithTransform($val, $transform = false)
    {
        switch ($transform)
        {
            case 'base64':
                for ($i = 0; $i < ceil(strlen($val) / 4); $i++)
                {
                    echo base64_decode(substr($val, $i * 4, 4));
                }
                break;
            default:
                echo $val;
                break;
        }
    }
}