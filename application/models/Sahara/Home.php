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
 * @date 8th August 2010
 */


/**
 * Loads and manipluates files in the users home directory.
 */
class Sahara_Home
{
    /** Home directory path. */
    private $_homeDirectory;

    /** @var array Directory contents. */
    private $_contents;

    /** @var The extra directories to check (these are relative to the base
	 *       home directory. */
    private $_extraDirs;

    /** The names of files of folders to ignore. */
    private $_exclusionList;

    /** Whether to check creation time stamp of files. */
    private $_checkTimeStamp = false;

    /** Minimum modiciation timestamp. */
    private $_modTimeStamp;

    public function __construct($home, $ts = false)
    {
        $this->_homeDirectory = $home;

        $config = Zend_Registry::get('config');
        if ($ex = $config->home->exclusions)
        {
            $this->_exclusionList = explode(',', $ex);
        }
        else
        {
            $this->_exclusionList = array();
        }

        if ($ex = $config->home->extradirs)
        {
            $this->_extraDirs = explode(',', $ex);
        }
        else
        {
            $this->_extraDirs = false;
        }

        if ($ts)
        {
            $this->_checkTimeStamp = true;
            $this->_modTimeStamp = $ts;
        }
    }

    /**
     * Loads the contents of the directory. The contents are returned in
     * the form:
     *
     * 	name => file |
     * 	        array (
     * 				name => file |
     * 						array(....)
     * 			)
     *
     * @return array directory contents
     */
    public function loadContents()
    {
        $this->_contents = $this->_recursiveList($this->_homeDirectory);

        if ($this->_extraDirs)
        {
            foreach ($this->_extraDirs as $dir)
            {
                $this->_contents[$dir] = $this->_recursiveList($this->_homeDirectory . '/' . $dir);

            }
        }

        return $this->_contents;
    }

    /**
     * Flattened directory contents in the form:
     *
     * 	name => array(
     * 		path => file path
     * 		file => file name
     *  )
     *
     * @return array gets the flattened contents
     */
    public function getFlattenedContents()
    {
        $flattened = $this->_flatten($this->_contents, '');
        ksort($flattened);
        return $flattened;
    }

    /**
     * Recursively flatten directory contents.
	 *
     * @param array $contents unflattened contents
     * @param String $dir directory of contents
     * @return flattened directory contents
     */
    private function _flatten($contents, $dir)
    {
        $flattened = array();

        foreach ($contents as $f => $v)
        {
            if (is_array($v))
            {
                $flattened = array_merge($flattened, $this->_flatten($v, $dir . '/' . $f));
            }
            else
            {
                /* Deal with a file of the same name in a different directory. */
                $key = $f;
                while (array_key_exists($key, $flattened))
                {
                    $last = substr($key, strlen($key) - 1);
                    if (is_int($last))
                    {
                        $key = substr($key, -1) . ++$last;
                    }
                    else
                    {
                        $key = $key . 1;
                    }
                }

                $flattened[$key] = $this->getDownloadUrl($dir, $f);
            }
        }

        return $flattened;
    }

    /**
     * Recursivly list the contents of a directory.
     *
     * @param Stirng $dir directory
     * @return array directory contents
     */
    private function _recursiveList($dir)
    {
        $contents = array();

        foreach (scandir($dir) as $f)
        {
            /* Ignore dot files. */
            if (strpos($f, '.') === 0) continue;

            /* If in exclusions, ignore the file. */
            if (in_array($f, $this->_exclusionList)) continue;

            if (is_dir($dir . '/' . $f))
            {
            	/* If the file is directory, load the file contents of it. */
                $cs = $this->_recursiveList($dir . '/' . $f);
                if (count($cs))
                {
                    $contents[$f] = $cs;
                }
            }
            else
            {
                if ($this->_checkTimeStamp)
                {
                    /* Only files after the check timestamp are needed.
                     * stat result 9 is file modification time. */
                    $stat = stat($dir . '/' . $f);
                    if ($stat[9] > $this->_modTimeStamp) $contents[$f] = $f;
                }
                else
                {
                    $contents[$f] = $f;
                }
            }
        }

        return $contents;
    }

    /**
     * Returns true if the specified home directory exists.
     */
    public function isValid()
    {
        return is_dir($this->_homeDirectory);
    }

    /**
     * Returns the previously loaded contents.
	 *
	 * @return array directory contents
     */
    public function getContents()
    {
        return $this->_contents;
    }

    /**
     * Gets the download link of the file.
     *
     * @param  $file
     */
    public function getDownloadUrl($dir, $file)
    {
        $link = '';

        if ($dir != '')
        {
            if (strpos($dir, '/') === 0) $dir = substr($dir, 1);
            $link .= '/path/' . implode(':', explode('/', $dir));
        }

        $link .= '/file/' . $file;
        return $link;
    }

    /**
     * Returns the home directory location.
     *
     * @return String home directory location.
     */
    public static function getHomeDirectoryLocation()
    {
        // TODO Make this abstract, make this OS agnostic
        list($jk, $user) = explode(':', Zend_Auth::getInstance()->getIdentity());
        exec("getent passwd `id -u $user`", $output, $ret);

        if ($ret != 0)
        {
            Sahara_Logger::getInstance()->error("Getting home directory for user $user failed, getent return code is " .
            		"$ret.");
            return null;
        }

        $parts = explode(':', $output[0]);
        return $parts[5];
    }
}
