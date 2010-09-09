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
 * @author Tania Machet (tmachet)
 * @date 9th September 2010
 */

/**
 * Collects the data needed for the Structural Visualisation Rig
 *
 */
class UTS_StructuralVisualisation extends Sahara_Session_Element
{
    public function __construct($rig, $options = array())
    {
    	parent::__construct($rig);
    	
    }

	/**
     * Loads the details of the rig's models.
     */
    public function init()
    {
        if (!($num = $this->_getRigAttribute('MaxModels')))
        {
            $this->_logger->warn("Unable to determine maximum number of models for this rig. The  " .
                    'default value of 4 models will be used.');
            $num = 4;
        }

        $this->_modelConfig = array();
        
        for ($i = 1; $i <= $num; $i++)
        {
            $modelConf = $this->_getRigAttribute("Model_$i");
            if (!$modelConf)
            {
                $this->_logger->warn("Unable to load model configuration for model number $i, it is not enabled.");
                continue;
            }

            $model = array();
            foreach (explode(',', $modelConf) as $p)
            {
                list($key, $val) = explode('=', $p, 4);
                $key = strtoupper(trim($key));
                $val = trim($val);
                switch ($key)
                {
                    case 'LABEL':
                        $model['label'] = $this->_getRigAttribute($val);
                        break;
                    case 'DESCRIPTION':
                        $model['description'] = $this->_getRigAttribute($val);
                        break;
                    case 'VERTICAL':
                        $model['vertical'] = array();
                        foreach (explode(';', $val) as $f)
                        {
                        	$model['vertical'][$f] = array();
                        	// For each vertical force, get description and label
                        	foreach (explode(',',$this->_getRigAttribute($f)) as $g)
                        	{
                				list($fkey, $fval) = explode('=', $g, 4);
                				$fkey = strtoupper(trim($fkey));
                				$fval = trim($fval);
				                switch ($vkey)
				                {
				                    case 'LABEL':
				                        $model['vertical'][$f]['label'] = $this->_getRigAttribute($fval);
				                        break;
				                    case 'DESCRIPTION':
				                        $model['vertical'][$f]['description'] = $this->_getRigAttribute($fval);
				           	        break;
				                 }
                        	}
                        } 		
                        break;
                    case 'HORIZONTAL':
                        $model['horizontal'] = array();
                        foreach (explode(';', $val) as $f)
                        {
                        	// For each horizontal force, get description and label
                        	foreach (explode(',',$this->_getRigAttribute($f)) as $g)
                        	{
                				list($fkey, $fval) = explode('=', $g, 4);
                				$fkey = strtoupper(trim($fkey));
                				$fval = trim($fval);
				                switch ($fkey)
				                {
				                    case 'LABEL':
				                        $model['horizontal'][$f]['label'] = $this->_getRigAttribute($fval);
				                        break;
				                    case 'DESCRIPTION':
				                        $model['horizontal'][$f]['description'] = $this->_getRigAttribute($fval);
				           	        break;
				                 }
                        	}
                        }
                        break;
                    default:
                   $model[$key] = $val;
                }
            }
            
			array_push($this->_modelConfig, $model);
        }
    }

    public function render()
    {
        $this->init();
        $this->_view->models = $this->_modelConfig;
        
    }
    
    
    /**
     * Loads the details of the rig's forces.
     */
    public function initVerticalForces()
    {
        if (!($num = $this->_getRigAttribute('MaxVertForces')))
        {
            $this->_logger->warn("Unable to determine maximum number of vertical for this rig. The  " .
                    'default value of 8 forces will be used.');
            $num = 8;
        }

        $this->_vforceConfig = array();
        
        for ($i = 1; $i <= $num; $i++)
        {
            $vforceConf = $this->_getRigAttribute("VForce_$i");
            if (!$modelConf)
            {
                $this->_logger->warn("Unable to load model configuration for vertical force number $i, it is not enabled.");
                continue;
            }

            $vforce = array();
            foreach (explode(',', $vforceConf) as $p)
            {
                list($key, $val) = explode('=', $p, 2);
                $key = strtoupper(trim($key));
                $val = trim($val);
                switch ($key)
                {
                    case 'LABEL':
                        $vforce['label'] = $val;
                        break;
                    case 'DESCRIPTION':
                        $vforce['description'] = $val;
                        break;
                    default:
                        $vforce[$key] = $val;
                }
            }

        }
    }
 }
