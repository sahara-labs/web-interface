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
 * @date 24th March 2010
 */

class Sahara_DateTimeUtil
{
    /**
     * Returns true if the first specified dateTime is before the second
     * dateTime. The dateTime format is ISO 8601 and specified in
     * 'http://www.w3.org/TR/xmlschema11-2/#dateTime'.
     *
     * @param String $tm1 first time
     * @param String $tm2 second time
     * @return boolean true if the first time is before the second time
     */
    public static function isBefore($tm1, $tm2)
    {
        return Sahara_DateTimeUtil::getTsFromISO8601($tm1) < Sahara_DateTimeUtil::getTsFromISO8601($tm2);
    }

    /**
     * Returns true if the specified dateTime is before the current
     * time. The dateTime format is 'ISO 8601 and
     * specified in 'http://www.w3.org/TR/xmlschema11-2/#dateTime'.
     *
     * @param String $tm1 first time
     * @param String $tm2 second time
     * @return boolean true if the first time is before the second time
     */
    public static function isBeforeNow($tm)
    {
        return Sahara_DateTimeUtil::getTsFromISO8601($tm) < time();
    }

    /**
     * Returns true if the first specified dateTime is after the second
     * dateTime. The dateTime format is ISO 8601 and specified in
     * 'http://www.w3.org/TR/xmlschema11-2/#dateTime'.
     *
     * @param String $tm1 first time
     * @param String $tm2 second time
     * @return boolean true if the first time is before the second time
     */
    public static function isAfter($tm1, $tm2)
    {
        return Sahara_DateTimeUtil::getTsFromISO8601($tm1) > Sahara_DateTimeUtil::getTsFromISO8601($tm2);
    }

    /**
     * Returns true if the specified dateTime is after the current
     * time. The dateTime format is 'ISO 8601 and
     * specified in 'http://www.w3.org/TR/xmlschema11-2/#dateTime'.
     *
     * @param String $tm1 first time
     * @param String $tm2 second time
     * @return boolean true if the first time is before the second time
     */
    public static function isAfterNow($tm)
    {
        return Sahara_DateTimeUtil::getTsFromISO8601($tm) > time();
    }

    /**
     * Returns a UNIX timestamp from an ISO8601 dateTime value.
     * Ignores timezone.
     *
     * @param String $tm ISO8601 dateTime
     * @return int UNIX timestamp
     */
    public static function getTsFromISO8601($tm)
    {
        list($date, $time) = explode('T', $tm, 2);
        list($year, $mon, $day) = explode('-', $date, 3);
        list($hour, $min, $sec) = explode(':', $time, 3);

        if (strlen($sec) > 2)
        {
            $sec = substr($sec, 0, 2);
        }

        return mktime($hour, $min, $sec, $mon, $day, $year);
    }

    /**
     * Returns an array contains hour, minute, second from
     * a ISO8601 timestamp.
     *
     * @param String $tm timestamp
     * @return array hour, minute, second
     */
    public static function getTimeFromISO8601($tm)
    {
        list($date, $time) = explode('T', $tm, 2);
        $arr = explode(':', $time, 3);

        if (strlen($arr[2]) > 2)
        {
            $arr[2] = substr($arr[2], 0, 2);
        }
        return $arr;
    }

    /**
     * Returns the slot number for a time.
     *
     * @param String $tm ISO8601 time
     * @return int slot number
     */
    public static function getSlotTimeFromISO8601($tm)
    {
        list($hr, $min, $sec) = self::getTimeFromISO8601($tm);
        return ($hr * 3600 + $min * 60 + $sec) / BookingsController::SLOT_DURATION;
    }

    /**
     * Returns a display hour from a slot.
     *
     * @param int $sl slot
     * @return String display hour
     */
    public static function displayHourFromSlot($sl)
    {
        $sec = $sl * BookingsController::SLOT_DURATION;
        $hr = floor($sec / 3600);

        if ($hr == 0 || $hr == 24) return '12 am';
	    else if ($hr < 12) return $hr . ' am';
	    else if ($hr == 12) return '12 pm';
	    else return ($hr -12) . ' pm';
    }

    /**
     * Zero pads a field.
     *
     * @param int $tm time field
     * @return String zero padded field
     */
    public static function zeroPad($tm)
    {
        if ($tm < 10)
        {
            return "0$tm";
        }
        return $tm;
    }
}
