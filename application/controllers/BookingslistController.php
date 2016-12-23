<?php
/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2016, University of Technology, Sydney
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
 * @date 19th December 2016
 */

/**
 * Controller to allow an administrator to view all bookings for a lab and 
 * cancelling bookings.
 */
class BookingslistController extends Sahara_Controller_Action_Acl
{
	/** Fomrat to convert SQL time to DateTime objects. */
	const DATE_FORMAT = 'Y-m-d H:i:s';
	
	/**
	 * Display main bookings page.
	 */
	public function indexAction()
	{
		if (!($this->hasParam('rig') && 
			  $rig = Sahara_Database_Record_Rig::loadFirst(array('name' => $this->_getParam('rig')))))
		{
			$this->_logger->debug('Missing param or rig not found');
			$this->_redirectTo('index', 'index');
		}
		
		$this->view->headTitle($this->_headPrefix . "Reservations for $rig->name");
		
		$from = new DateTime();
		$from->setTime(0, 0, 0);
		
		
			
		$to = new DateTime();
		$to->setTime(0, 0, 0);
		if ($this->hasParam('end'))
		{
			list($year, $mon, $day) = explode('-', $this->_getParam('end'));
			$to->setDate($year, $mon, $day);
		}
		else
		{
			$to = new DateTime();
			$to->setTimestamp($from->getTimestamp());
			$to->add(new DateInterval('P7D'));
		}
		
		
	}
	
	/**
	 * Lists the bookings between a start and end time.
	 */
	public function listAction()
	{
		$this->_helper->viewRenderer->setNoRender();
		$this->_helper->layout()->disableLayout();
		
		if (!($this->hasParam('rig') && 
			  $rig = Sahara_Database_Record_Rig::loadFirst(array('name' => $this->_getParam('rig')))))
		{
			echo '[]';
			return;
		}
		
		$from = new DateTime();
		$from->setTime(0, 0, 0);
		
		if ($this->hasParam('start'))
		{
			list($year, $mon, $day) = explode('-', $this->_getParam('start'));
			$from->setDate($year, $mon, $day);
		}
			
		$to = new DateTime();
		$to->setTime(0, 0, 0);
		if ($this->hasParam('end'))
		{
			list($year, $mon, $day) = explode('-', $this->_getParam('end'));
			$to->setDate($year, $mon, $day);
		}
		else
		{
			$to = new DateTime();
			$to->setTimestamp($from->getTimestamp());
			$to->add(new DateInterval('P7D'));
		}
		
		$bookings = $this->_loadBookings($rig, $from, $to);
		$response = array();
		foreach ($bookings as $bk)
		{
			array_push($response, array(
				'id' => $bk->id,
				'start_time' => $bk->start_time->format(DateTime::ISO8601),
				'end_time' => $bk->end_time->format(DateTime::ISO8601),
				'type' => $bk->resource_type,
				'user' => array(
					'id' => $bk->user->id,
					'name' => $bk->user->name,
					'first_name' => $bk->user->first_name,
					'last_name' => $bk->user->last_name,
					'persona' => $bk->user->persona,
					'email' => $bk->user->email,
				)
			));
		}
		
		echo $this->view->json($response);
	}
				
	
	/**
	 * Load the bookings function.
	 * 
	 * @param Sahara_Database_Record_Rig $rig 1
	 * @param DateTime $from beginning time to search
	 * @param DateTime $to end time to search
	 * @return array list of bookings
	 */
	private function _loadBookings($rig, $from, $to)
	{
	    $bookings = Sahara_Database_Record_Booking::query('SELECT * FROM bookings WHERE ' . 
				 ' active = ? ' . 
				 ' AND ( rig_id = ? OR rig_type_id = ? )' . 
				 ' AND end_time > ? AND start_time < ? ' . 
				 'ORDER BY start_time', 
		 		array(1, $rig->id, $rig->type->id, $from->format(self::DATE_FORMAT), $to->format(self::DATE_FORMAT))		 				
		);

		if (count($bookings) > 0)
		{	    
			$this->_removeOverlapped($bookings);
		}
		
		return $bookings;
	}

	
	/**
	 * Removes overlapped bookings.
	 * 
	 * @param array $bookings
	 */
	private function _removeOverlapped(&$bookings)
	{
		$commited = array();
		foreach ($bookings as $b)
		{
			if ($b->resource_type == 'RIG') 
			{
				$commited[$b->start_time->getTimestamp()] = $b->end_time->getTimestamp();
			}
		}

		$remove = array();
		for ($i = 0; $i < count($bookings); $i++)
		{
			if ($bookings[$i]->resource_type == 'RIG') continue;
			
			$start = $bookings[$i]->start_time->getTimestamp();
			$end = $bookings[$i]->end_time->getTimestamp();
			foreach ($commited as $cs => $ce)
			{	
				if ($start >= $cs && $start < $ce
					|| $end > $cs && $end <= $ce)
				{
					array_push($remove, $i);
					break;
				}
			}
			
			if (!in_array($i, $remove)) $commited[$start] = $end;
		}
		
		foreach ($remove as $r) unset($bookings[$r]);
	}
}
 
