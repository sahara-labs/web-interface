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
 * @date 1st November 2012
 */

/**
 * Base class for data access objects. 
 * <br />
 * This abstract class is intentionally light on correctness validation. Table 
 * definitions are not loaded and no database structure validation is performed.
 */
abstract class Sahara_Database_Record
{
    /** @var PDO Database connection. */
    protected $_db;

    /** @var String Table name. */
    protected $_name;
        
    /** @var String Primary key column name. Defaults to id. */
    protected $_idColumn = 'id';
    
    /** @var array Record data. */
    protected $_data = NULL;
    
    /** @var array Data to store in next update. */
    protected $_updatedData = array();
    
    /** @var bool Whether the record is persistant. */
    private $_isPersistant = false;
    
    /** @var bool Whether the a database update is required to persist. */
    private $_isDirty = false;
    
    /** Relationships this record has with records in other tables. 
     * The relationships take the form of relationship name with an array of
     * details that describe the nature of the relationship. 
     * A relationship can either be a foreign key or a join table. The following
     * lists the details of a relationship:
     * <ul>
     *    <li>table - The name of the table that this relationship joins to.</li>
     *    <li>entity - The name of the class that this record resolves to.</li>
     *    <li>join - The type of join, either 'foreign' or 'table' for foreign 
     *    keys or join tables respectively.</li>
     *    <li>foreign_key - The foreign key column on the joined table. This 
     *    is only used for the 'foreign' key join type.</li>
     *    <li>join_table - The name of the join table. This is only used for the
     *    'table' join type.</li>
     *    <li>join_table_source - The join table column that has this records 
     *    foreign key. This is only used for the 'table' join type.</li>
     *    <li>join_table_dest - The join table column that has the relationships
     *    record foreign key. This is only used for the 'table' join type.</li>
     * </ul>
     * 
     * @var array
     */
    protected $_relationships = array();
    
    /** @var array Loaded relationships. */
    protected $_loadedRelationships = array();
    
    public function __construct($data = array())
    {        
        /* Instead of using Zend_Db to interface we are using PDO directory. 
         * This is part of a plan to migrate away from the Zend framework
         * eventually. */
        $this->_db = Sahara_Database::getDatabase()->getConnection();
        
        /* The record data maybe supplied from things like relation loads. */
        $this->_data = $data;
        $this->_isPersistant = in_array($this->_idColumn, $data);
    }
    
    /**
     * Load a record with the specified where constraint(s). The return of this function is 
     * either a entity of the loaded record type or an array of record entities. 
     *
     * @param array $where where constraints (optional)
     * @param array $cols list of columns to select, (optional)
     * @param String $order column name to order the result set by (optional)
     * @param boolean $asc whether the order is ascending or descending, default ascending
     * @return array|Sahara_Database_Record|false 
     * @throw Sahara_Database_Exception 
     */
    public static function load($where = NULL, $cols = array(), $order = NULL, $asc = true)
    {
        $record = new static();
        
        /* We need to atleast loaded up a record primary key to be ensure
         * the record is persistent. */
        if (count($cols) && !in_array($this->_idColumn, $cols)) array_push($cols, $this->_idColumn);
        
        /* Prepare the SQL statement. */ 
        $stm = 'SELECT ' . (count($cols) ? implode(', ', $cols) : ' * ') . ' FROM ' . $record->_name;
        if (is_array($where))
        {
             $stm .= ' WHERE ';
             
             $first = true;
             foreach ($where as $c => $v)
             {
                 if (!$first) $stm .= ' AND ';
                 $first = false;
                 $stm .= $c . ' = ? ';
             }
        }
        
        /* Add order if specified. */
        if ($order)
        {
            $stm .= ' ORDER BY ' . $order . ($asc ? ' ASC' : ' DESC');
        }
        
        /* Execute the query. */
        $qu = $record->_db->prepare($stm);
        if (!$qu->execute(is_array($where) ? array_values($where) : NULL))
        {
            /* An error occurred executing the statement. */
            throw new Sahara_Database_Exception($qu);
        }
        
        /* Return result. */
        if ($qu->rowCount() == 0)
        {
            /* No rows found. */
            return false;
        }
        else if ($qu->rowCount() == 1)
        {
            /* One row. */
            $record->_data = $qu->fetch();
            $record->_isPersistant = true;
            
            return $record;
        }
        else
        {
            /* Lots of rows have been returned, an array set will be returned. */
            $rowSet = array();
            foreach ($qu->fetchAll() as $row)
            {
                $rec = new static();
                $rec->_data = $row;
                $rec->_isPersistant = true;
                array_push($rowSet, $rec);
            }
            
            return $rowSet;
        }
    }
        
    /**
     * Store this record in the database. If the record is not persistent
     * 
     */
    public function store()
    {
        // TODO
        if ($this->_isPersistant)
        {
            if ($this->_isDirty)
            {
                /* This is already a persistant record, however we need to 
                 * update its record. */
            }
        }
        else
        {
            $stm = 'INSERT INTO ' . $this->_name . ' ( ' . implode(', ', array_keys($this->_updatedData)) . ') VALUES ( ';
            
        }
    }

    /** 
     * Gets the value of a database column. This is a lazy-load style function
     * where the database will be hit at most once to load a variable. It is 
     * recommended to have the database object load values that will be 
     * subsequently be consumed in the load call rather than requiring selects
     * queries for each record column for obvious performance improvements.<br />
     * If the value of a column has been modified but it has not been persisted 
     * to the database, the original valueis returned. Only after the original
     * value has been stored, will it be returned as the record value.
     * 
     * @param String $col column name
     * @return String value of column.
     * @throw Sahara_Database_Exception failure querying database for a value
     */
    public function __get($col)
    {
        if (array_key_exists($col, $this->_relationships))
        {
            /* If the requested field is a relationship, we need to return the
             * relationship entities. */
            if (!array_key_exists($col, $this->_loadedRelationships) && $this->_isPersistant)
            {
                $rel = $this->_relationships[$col];
                $entityName = 'Sahara_Database_Record_' . $rel['entity'];
                $entity = new $entityName;
                
                /* Selected all fields form the join table. */
                $stm = 'SELECT ' . $rel['table'] . '.* FROM ' . $rel['table'];

                /* Adding reference information. */
                if ($rel['join'] == 'foreign')
                {
                    /* Foriegn key reference type. */
                    $stm .= ' WHERE ' . $rel['table'] . '.' . $rel['foreign_key'] . ' = ?';
                }
                else if ($rel['join'] == 'table')
                {
                    /* Join table reference type. */
                    $stm .= ' JOIN ' . $rel['join_table'] . ' ON ' . $rel['join_table'] . '.' . $rel['join_table_dest'] . ' = ' . $rel['table'] . '.' . $entity->getIdentityColumn();
                    
                    /* Constraint on join table. */
                    $stm .= ' WHERE ' . $rel['join_table'] . '.' . $rel['join_table_source'] . ' = ?';
                }
                else 
                {
                    /* Relationship description error. */
                    throw new Sahara_Database_Exception('Unknown relationship type ' . $rel['join']);
                }
                
                $qu = $this->_db->prepare($stm);
                if (!$qu->execute(array($this->_data[$this->_idColumn])))
                {
                    /* Error making query. */
                    throw new Sahara_Database_Exception($qu);
                }
                       
                $this->_loadedRelationships[$col] = array();
                foreach ($qu->fetchAll() as $row)
                {
                    array_push($this->_loadedRelationships[$col], new $entityName($row));
                }
            }
            
            return $this->_loadedRelationships[$col];
        }
        else
        {
            /* Requested field is a record column. */
            if (!array_key_exists($col, $this->_data) && $this->_isPersistant) 
            {
                /* If the column has not been previously been loaded, we need to 
                 * load its value. */
                $qu = $this->_db->prepare('SELECT ' . $col . ' FROM ' . $this->_name . ' WHERE ' . $this->_idColumn . ' = ?');
                if (!$qu->execute(array($this->_data['id'])))
                {
                    throw new Sahara_Database_Exception($qu);
                }
                
                $this->_data = array_merge($this->_data, $qu->fetch());
            }
            
            /* If the record is not persistant we haven't hit the database and 
             * therefore we still need to check whether the array is populated. */
            return array_key_exists($col, $this->_data) ? $this->_data[$col] : NULL;
        }   
    }
    
    /**
     * Sets a value to be stored in the next call to the store method.
     * 
     * @param String $col column name
     * @param mixed $val value to store
     */
    public function __set($col, $val)
    {
        $this->_isDirty = true;
        $this->_updatedData[$col] = $val;
    }
    
    /**
     * Gets the name of the identity column.
     * 
     * @var String name of the identity column
     */
    public function getIdentityColumn()
    {
        return $this->_idColumn;
    }
}
