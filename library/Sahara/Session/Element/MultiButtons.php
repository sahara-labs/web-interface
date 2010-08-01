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
 * @date 31st July 2010
 */

class Sahara_Session_Element_MultiButtons extends Sahara_Session_Element
{
    /** Buttons are placed on top of each other. */
    const VERTICAL = "vertical";

    /** Buttons are placed adjacent to each other. */
    const HORIZONTAL = "horiztional";

    /** The name of mutlibutton group. */
    private $_name;

    /** The button details. */
    private $_buttons;

    public function __construct($rig, $name, $buttons = array(), $options = array())
    {
        parent::__construct($rig);

        $this->_name = $name;

        if (is_array($buttons))
        {
            $this->_buttons = $buttons;
        }
        else
        {
            $this->_buttons = array();
        }

        /* Default options. */
        $this->_view->isHoriz = true;
        $this->_view->left = 0;
        $this->_view->top = 0;
        $this->_view->width = 60;
        $this->_view->height = 60;


        if (is_array($options))
        {
            foreach ($options as $o => $v)
            {
                $this->setOption($o, $v);
            }
        }
    }



    /**
     * Sets a mutlibutton option. The options are:
     * <ul>
     * 	<li>orientation - Either 'vertical' or 'horizontal'.</li>
     * 	<li>left - Left position.</li>
     * 	<li>top - Top position.</li>
     *  <li>width - The width of the buttons.</li>
     *  <li>height - The height of the buttons.</li>
     * </ul>
	 *
     * @param String $option option name
     * @param mixed $value option value
     */
    public function setOption($option, $value)
    {
        switch ($option)
        {
            /* Positional details. */
            case 'orientation':
                $this->_view->isHoriz = $value == self::HORIZONTAL;
                break;
            case 'left':
                $this->_view->left = $value;
                break;
            case 'top':
                $this->_view->top = $value;
                break;
            case 'width':
                $this->_view->width = $value;
                break;
            case 'height':
                $this->_view->height = $value;
                break;

            default:
                $this->_logger->debug("Unknown multi-button option $option.");
                break;
        }
    }

    public function render()
    {
        $this->_view->name = $this->_name;
        $this->_view->buttons = $this->_buttons;
        return $this->_view->render('MultiButtons/_multiButtons.phtml');
    }
}