<?php

class Sahara_Home
{
    /** Home directory path. */
    private $_homeDirectory;

    /** @var array Directory contents. */
    private $_contents;

    /** The names of files of folders to ignore. */
    private $_exclusionList;

    /** Whether to check creation time stamp of files. */
    private $_checkTimeStamp = false;

    /** Minimum modiciation timestamp. */
    private $_modTimeStamp;

    public function __construct($home, $ts = false)
    {
        $this->_homeDirectory = $home;

        if (($ex = Zend_Registry::get('config')->home->exclusions))
        {
            $this->_exclusionList = explode(',', $ex);
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
        return '/home/user';
    }
}