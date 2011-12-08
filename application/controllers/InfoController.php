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
 * @date 21st March 2010
 */

/**
 * Controller to provide information about the lab.
 */
class InfoController extends Sahara_Controller_Action_Acl
{
	/**
     * Action to provide information about the lab.
     */
    public function indexAction()
    {
        $this->view->headTitle($this->_headPrefix . 'News');
        $this->view->messages = $this->_flashMessenger->getMessages();

        $inst = Zend_Registry::get('config')->institution;
        $this->view->inst = $inst;
        if (is_file(Bootstrap::$rootDirectory . '/../institution/' . $inst . '/News.php'))
        {
        	$newsClass = $inst . '_News';
        	$news = new $newsClass;
        }
        else
        {
        	$news = new Sahara_DefaultInfo;
        }

        $this->view->news = $news->getNews();

    }

    /**
     * Action to provide a FAQ.
     */
    public function faqAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Frequently Asked Questions');
        $this->view->messages = $this->_flashMessenger->getMessages();

        $inst = Zend_Registry::get('config')->institution;
        $this->view->inst = $inst;
        if (is_file(Bootstrap::$rootDirectory . '/../institution/' . $inst . '/FAQ.php'))
        {
        	$faqClass = $inst . '_FAQ';
        	$faq = new $faqClass;
        }
        else
        {
        	$faq = new Sahara_DefaultInfo;
        }

        $this->view->faq = $faq->getFAQ();
    }

    /**
     * Action to provide contact informaion.
     */
    public function contactAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Contact Us');
        $this->view->messages = $this->_flashMessenger->getMessages();

        $inst = Zend_Registry::get('config')->institution;
        $this->view->inst = $inst;
        if (is_file(Bootstrap::$rootDirectory . '/../institution/' . $inst . '/Contacts.php'))
        {
        	$contactClass = $inst . '_Contacts';
        	$contacts = new $contactClass;
        }
        else
        {
        	$contacts = new Sahara_DefaultInfo;
        }

        $this->view->contacts = $contacts->getContacts();
    }
}