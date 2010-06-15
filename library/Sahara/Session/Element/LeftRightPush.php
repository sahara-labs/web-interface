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
 * @date 2nd May 2010
 */

/**
 * Pushes elements which are vertically placed to the left and right of rig
 * contents div (#content) to allow the rig contents space to be increased
 * in size. 'Pushing' means reading the value of the 'left' or 'right' css
 * properties (depending on the push direction) and adding the push value
 * to it. The things pushed are:
 * <ul>
 * 	<li>Session panel (contains session time and session remaining time). This
 * 	is pushed left towards the left most screen edge.</li>
 * 	<li>Any element with the class '.leftpush'. This is pushed left.</li>
 *  <li>Action bar (contains finish session and logout buttons). This is pushed
 *  right towards the rig most screen edge.</li>
 *  <li>Any element with the class '.rightpush'. This pushed right.</li>
 *
 * </ul>
 */
class Sahara_Session_Element_LeftRightPush extends Sahara_Session_Element
{
    /** @var int The amount to push the left contents in pixels. */
    private $_leftPush;

    /** @var int The amount to push the rig contents in pixels. */
    private $_rightPush;

    /** @var int The top offset of right. */
    private $_rightTop;

    /**
     * Constructor.
     * @param String $rigClient rig client URL
     * @param int $left the amount to push left (optional)
     * @param int $right the amount to push right (optional)
     * @param int $rightTop the vertical offset of right (optional)
     */
    public function __construct($rigClient, $left = 0, $right = 0, $rightTop = 0)
    {
        parent::__construct($rigClient);

        $this->_leftPush = $left;
        $this->_rightPush = $right;
        $this->_rightTop = $rightTop;
    }

    /**
     * Sets the left push distance.
     *
     * @param int $pixels distance in pixels
     */
    public function setLeftPush($pixels)
    {
        $this->_leftPush = $pixels;
    }

    /**
     * Sets the right push distance.
     *
     * @param int $pixels distance in pixels
     */
    public function setRightPush($pixels)
    {
        $this->_rightPush = $pixels;
    }

    /**
     * Sets the right top offset from its normal height.
     *
     * @param int $pixels right top offset
     */
    public function setRightTop($pixels)
    {
        $this->_rightTop = $pixels;
    }

    public function render()
    {
        $this->_view->leftPush = $this->_leftPush;
        $this->_view->rightPush = $this->_rightPush;
        $this->_view->rightTop = $this->_rightTop;

        return $this->_view->render('LeftRightPush/_leftRightPush.phtml');
    }
}