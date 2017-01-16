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
 * @date 23rd Janurary 2013
 */

/**
 * Entity for the rig table.
 */
class Sahara_Database_Record_Rig extends Sahara_Database_Record
{
    /** @var String Table name. */
    protected $_name = 'rig';
    
    /** @var array Relationships with other tables. */
    protected $_relationships = array(
        'type' => array(
            'table' => 'rig_type',
            'entity' => 'RigType',
            'join' => 'local',
            'foreign_key' => 'type_id' 
        )
    );
    
    /**
     * Load the bookings for this rig for the specifed date range.
     *
     * @param DateTime $from beginning time to search
     * @param DateTime $to end time to search
     * @return array list of bookings
     */
    public function dateRangeBookings($from, $to)
    {
    	$bookings = Sahara_Database_Record_Booking::query('SELECT * FROM bookings WHERE ' .
    			' active = ? ' .
    			' AND ( rig_id = ? OR rig_type_id = ? )' .
    			' AND end_time > ? AND start_time < ? ' .
    			'ORDER BY start_time',
    			array(1, $this->id, $this->type->id, $from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s'))
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
 
