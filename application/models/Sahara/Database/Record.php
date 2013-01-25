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
     *    <li>join - The type of join, either 'foreign', 'local' or 'table' for foreign 
     *    keys in the relationship table, relationship tables foriegn key in this table
     *    or join tables respectively.</li>
     *    <li>foreign_key - The foreign key column on the joined table. This 
     *    is only used for the 'foreign' key join type.</li>
     *    <li>join_table - The name of the join table. This is only used for the
     *    'table' join type.</li>
     *    <li>join_table_source - The join table column that has this records 
     *    foreign key. This is only used for the 'table' join type.</li>
     *    <li>join_table_dest - The join table column that has the relationships
     *    record foreign key. This is only used for the 'table' join type.</li>
     *    <li>null_on_delete - Whether the foreign relationship record should have the 
     *     foreign key column nulled instead of the record being deleted. This only
     *     applies to 'foreign' type joins'.</li>
     * </ul>
     * 
     * @var array
     */
    protected $_relationships = array();
    
    /** @var array Loaded relationships. */
    protected $_loadedRelationships = array();
    
    /** @var array Updated relationships. */
    protected $_updatedRelationships = array();
    
    public function __construct($data = array())
    {        
        /* Instead of using Zend_Db to interface we are using PDO directory. 
         * This is part of a plan to migrate away from the Zend framework
         * eventually. */
        $this->_db = Sahara_Database::getDatabase()->getConnection();
        
        /* The record data maybe supplied from things like relation loads. */
        $this->_data = $data;
        foreach ($this->_data as $col => $val) $this->_data[$col] = self::_convertFromSQL($val);
        
        /* We are persistant if we have a primary key. */
        $this->_isPersistant = array_key_exists($this->_idColumn, $this->_data);
    }
    
    /**
     * Load a record with the specified where constraint(s). The where constraint can be 
     * either a list of column names or a primary key of the entity to load. If where 
     * constraints are specified a list of records is returned, if a primary key is supplied
     * a record is returned of false if record was not found.
     *
     * @param mixed $where where constraints (optional)
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
            /* Query of table column constraints. */
            $stm .= ' WHERE ';
             
            $first = true;
            foreach ($where as $c => $v)
            {
                if (!$first) $stm .= ' AND ';
                $first = false;
                $stm .= $c . ' = ? ';
            }
             
            $constraints = array_values($where);
        }
        else if ($where !== NULL)
        {
            /* Primary key constraint. */
            $stm .= ' WHERE ' . $record->_idColumn . ' = ?';
            $constraints = array($where);
        }
        else
        {
            /* No constraints. */
            $constraints = NULL;
        }
        
        /* Add order if specified. */
        if ($order)
        {
            $stm .= ' ORDER BY ' . $order . ($asc ? ' ASC' : ' DESC');
        }
        
        /* Execute the query. */
        $qu = $record->_db->prepare($stm);
        if (!$qu->execute($constraints))
        {
            /* An error occurred executing the statement. */
            throw new Sahara_Database_Exception($qu);
        }
        
        /* Return result. */
        if ($qu->rowCount() == 0)
        {
            /* No rows found. */
            return is_array($where) || $where == NULL ? array() : false;
        }
        else if ($qu->rowCount() == 1 && !is_array($where) && $where != NULL)
        {
            /* One row from primary key. */
            return new static($qu->fetch());
        }
        else
        {
            /* Search, an array set will be returned. */
            $rowSet = array();
            foreach ($qu->fetchAll() as $row)
            {
                $rec = new static($row);
                array_push($rowSet, $rec);
            }
            
            return $rowSet;
        }
    }
        
    /**
     * Store this record in the database. If the record is not persistent, it 
     * is inserted into the database as a new record. If the record is persistant
     * the record is updated with any updated data.
     */
    public function save()
    {
        if ($this->_isPersistant && $this->_isDirty)
        {
            /* This is already a persistant record, so we need to update its record. */
            $stm = 'UPDATE ' . $this->_name . ' SET ' . implode(' = ?, ', array_keys($this->_updatedData));
            $stm .= ' = ? ';
            $values = array_values($this->_updatedData);

            /* Run conversison for correct types. */
            foreach ($values as $i => $v) $values[$i] = self::_convertForSQL($v);
            
            /* Local relationships are added as column values. */
            foreach ($this->_updatedRelationships as $rel => $ref)
            {
                if ($this->_relationships[$rel]['join'] == 'local')
                {
                    if (!$ref->isPersistent()) throw new Sahara_Database_Exception('Reference entity is not persistent.');
                    
                    $stm .= ', ' . $this->_relationships[$rel]['foreign_key'] . ' = ? ';
                    array_push($values, $ref->__get($ref->getIdentityColumn()));
                    
                    $this->_data[$this->_relationships[$rel]['foreign_key']] = $ref->__get($ref->getIdentityColumn());
                    $this->_loadedRelationships[$rel] = $ref;
                    unset($this->_updatedRelationships[$rel]);
                }
            }
            
            /* Constraint to update the correct record. */
            $stm .= ' WHERE ' . $this->_idColumn . ' = ?';
            array_push($values, $this->_data[$this->_idColumn]);

            /* Update the record. */
            $qu = $this->_db->prepare($stm);
            if (!$qu->execute($values))
            {
                /* Error running update. */
                throw new Sahara_Database_Exception($qu);
            }
            
            /* Load the updated data. */
            foreach ($this->_updatedData as $key => $val) $this->_data[$key] = self::_convertFromSQL($val);
            
            /* Make this record as clean. */
            $this->_isDirty = false;
            $this->_updatedData = array();
        }
        else if (!$this->_isPersistant)
        {
            $stm = 'INSERT INTO ' . $this->_name . ' ( ' . implode(', ', array_keys($this->_updatedData));
            $values = array_values($this->_updatedData);
            
            /* Run conversion for correct types. */
            foreach ($values as $i => $v) $values[$i] = self::_convertForSQL($v);

            /* Local relationships are added as column values. */
            foreach ($this->_updatedRelationships as $rel => $ref)
            {
                if ($this->_relationships[$rel]['join'] == 'local')
                {
                    /* Local relationship entities need to be persistent so they have a primary key. */
                    if (!$ref->isPersistent()) throw new Sahara_Database_Exception('Referenced entity is not persistent.'); 
                    
                    $stm .= ', ' . $this->_relationships[$rel]['foreign_key'];
                    array_push($values, $ref->__get($ref->getIdentityColumn()));
                    
                    $this->_data[$this->_relationships[$rel]['foreign_key']] = $ref->__get($ref->getIdentityColumn());
                    $this->_loadedRelationships[$rel] = $ref; 
                    unset($this->_updatedRelationships[$rel]);
                }
            }
            
            $stm .= ' ) VALUES ( ?' . str_repeat(', ?', count($values) - 1) . ' )';

            /* Insert the record. */
            $qu = $this->_db->prepare($stm);
            if (!$qu->execute($values))
            {
                /* Some error inserting record into database. */
                throw new Sahara_Database_Exception($qu);
            }
            
            /* After the record has been inserted, it may be requested but we don't
             * want another database hit. */
            $this->_data = $this->_updatedData;
            foreach ($this->_data as $key => $val)
            {
                $this->_data[$key] = self::_convertFromSQL($val);
            }
            
            /* Mark the entity as persistent. */
            $this->_isPersistant = true;
            $this->_data[$this->_idColumn] = $this->_db->lastInsertId();
            
            /* All data has been commited so there is nothing more to updated. */
            $this->_isDirty = false;
            $this->_updatedData = array();
        }
        
        /* Make sure all the references are consistent. */
        foreach ($this->_updatedRelationships as $rel => $ref)
        {
            switch ($this->_relationships[$rel]['join'])
            {
                case 'foreign':
                    /* For foriegn relationships we need to inject this records primary 
                     * key and save the relationship entity. */
                    foreach ($ref as $record)
                    {
                        $record->__set($this->_relationships[$rel]['foreign_key'], $this->_data[$this->_idColumn]);
                        $record->save();
                    }
                    $this->_loadedRelationships[$rel] = $ref;
                    break;
                    
                case 'table':
                    /* For join table relationships we need to insert a record into the 
                     * join table with the primary keys of the records. Therefore, the 
                     * relationship entity must already be persistant. */
                    foreach ($ref as $record)
                    {
                        if (!$record->isPersistent()) throw new Sahara_Database_Exception('Cannot add relationship in join table ' .
                                'because the relationship entity is not persistent.');
                        
                        $stm = 'INSERT INTO ' . $this->_relationships[$rel]['join_table'] . 
                                ' ( ' . $this->_relationships[$rel]['join_table_source'] . ', ' . $this->_relationships[$rel]['join_table_dest'] . ' ) ' .
                                ' VALUES ( ? , ? )';
                        
                        $qu = $this->_db->prepare($stm);
                        if (!$qu->execute(array($this->_data[$this->_idColumn], $record->__get($record->getIdentityColumn()))));
                        {
                            throw new Sahara_Database_Exception($qu);
                        }
                    }
                    
                    $this->_loadedRelationships[$rel] = $ref;
                    break;
                    
                case 'local':
                    throw new Sahara_Database_Exception('Assertion error, bug in Sahara_Database_Record->save, ' . 
                            'local relationships should not need further processing.');
                    break;
                    
                default:
                    throw new Sahara_Database_Exception('Bad relationship join type. Must be \'foreign\', \'table\' or \'local\'.');
                    break;
            }
        }

        /* Loaded relationships, may have been modified so we need to cascade the
         * updated to those records. */
        foreach ($this->_loadedRelationships as $ref) 
        {
            if (is_array($ref)) foreach ($ref as $r) $r->save();
            else $ref->save();
        }
    }

    /**
     * Deletes the record including any referenced records.
     * 
     * @throws Sahara_Database_Exception if error occurs during deletion
     */
    public function delete()
    {
        /* It does not make sense to attempt to delete a non-persistant record. */
        if (!$this->_isPersistant)
        {
            throw new Sahara_Database_Exception('Unable to delete non-persistant record.');
        }
        
        /* First the reference records must be deleted. */
        foreach ($this->_relationships as $name => $rel)
        {
            switch ($rel['join'])
            {
                case 'local':
                    /* Nothing to delete for this case, because the reference 
                     * is stored in this record. */
                    break;
                    
                case 'foreign':
                    foreach ($this->__get($name) as $r)
                    {
                        if (array_key_exists('null_on_delete', $rel) && $rel['null_on_delete'])
                        {
                            $r->__set($rel['foreign_key'], NULL);
                            $r->save();
                        }
                        else
                        {
                            /* Delete the relationship record. */
                            $r->delete();
                        }
                    }
                    break;
                    
                case 'table':
                    /* Any join table records need to be deleted. */
                    $stm = 'DELETE FROM ' . $rel['join_table'] . ' WHERE ' . $rel['join_table_source'] . ' = ?';
                    $qu = $this->_db->prepare($stm);
                    if (!$qu->execute(array($this->_data[$this->_idColumn])))
                    {
                        throw new Sahara_Database_Exception($qu);
                    }
                    break;
            }
            
            /* Delete this record. */
            $stm = 'DELETE FROM ' . $this->_name . ' WHERE ' . $this->_idColumn . ' = ?';
            $qu = $this->_db->prepare($stm);
            if (!$qu->execute(array($this->_data[$this->_idColumn])))
            {
                throw new Sahara_Database_Exception($qu);
            }
        }
    }

    /** 
     * Gets the value of a database column. This is a lazy-load style function
     * where the database will be hit at most once to load a variable. It is 
     * recommended to have the database object load values that will be 
     * subsequently be consumed in the load call rather than requiring selects
     * queries for each record column for obvious performance improvements.
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

            /* Updated related entities override existing related entities. */
            $resultSet = array();
            if (array_key_exists($col, $this->_updatedRelationships))
            {
            	if ($this->_relationships[$col]['join'] == 'local') return $this->_updatedRelationships[$col];
            	else $resultSet = $this->_updatedRelationships[$col];
            }
            
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
                    /* Foriegn key of the record in the relationship table. */
                    $stm .= ' WHERE ' . $rel['table'] . '.' . $rel['foreign_key'] . ' = ?';
                    $request = $this->_data[$this->_idColumn];
                }
                else if ($rel['join'] == 'local')
                {
                    /* Foriegn key of the relationship table stored in this record. */
                    $stm .= ' WHERE ' . $rel['table'] . '.' . $entity->getIdentityColumn() . ' = ?';
                   
                    /* Local records may foreign key may be NULL. */
                    if (!($request = $this->__get($rel['foreign_key']))) return NULL;
                }
                else if ($rel['join'] == 'table')
                {
                    /* Join table reference type. */
                    $stm .= ' JOIN ' . $rel['join_table'] . ' ON ' . $rel['join_table'] . '.' . $rel['join_table_dest'] . ' = ' . $rel['table'] . '.' . $entity->getIdentityColumn();
                    
                    /* Constraint on join table. */
                    $stm .= ' WHERE ' . $rel['join_table'] . '.' . $rel['join_table_source'] . ' = ?';
                    
                    $request = $this->_data[$this->_idColumn];
                }
                else 
                {
                    /* Relationship description error. */
                    throw new Sahara_Database_Exception('Unknown relationship type ' . $rel['join']);
                }
                
                $qu = $this->_db->prepare($stm);
                if (!$qu->execute(array($request)))
                {
                    /* Error making query. */
                    throw new Sahara_Database_Exception($qu);
                }
                       
                if ($this->_relationships[$col]['join'] == 'local')
                {
                    return $this->_loadedRelationships[$col] = new $entityName($qu->fetch());
                }
                else
                {
                    $this->_loadedRelationships[$col] = array();
                    foreach ($qu->fetchAll() as $row)
                    {
                        array_push($this->_loadedRelationships[$col], new $entityName($row));
                    }
                }
            }
            
            if ($this->_relationships[$col]['join'] == 'local')
            {
                return $this->_loadedRelationships[$col];
            }
            else
            {
                $resultSet = array_merge($resultSet, $this->_loadedRelationships[$col]);
                return $resultSet;
            }
        }
        else
        {
            /* Requested field is a record column. */
            if (array_key_exists($col, $this->_updatedData))
            {
                /* Recently set values overrides the actual record data. */
                return $this->_updatedData[$col];    
            }
            
            if (!array_key_exists($col, $this->_data) && $this->_isPersistant) 
            {
                /* If the column has not been previously been loaded, we need to 
                 * load its value. */
                $qu = $this->_db->prepare('SELECT ' . $col . ' FROM ' . $this->_name . ' WHERE ' . $this->_idColumn . ' = ?');
                if (!$qu->execute(array($this->_data['id'])))
                {
                    throw new Sahara_Database_Exception($qu);
                }
                
                $this->_data = array_merge($this->_data, self::_convertFromSQL($qu->fetch()));

            }
            
            return array_key_exists($col, $this->_data) ? $this->_data[$col] : NULL;
        }   
    }
    
    /**
     * Sets a value to be stored in the next call to the store method. This can 
     * be either column values or relationships to other tables. 
     * 
     * @param String $col column name
     * @param mixed $val value to store
     */
    public function __set($col, $val)
    {   
        if (array_key_exists($col, $this->_relationships))
        {       
            if ($this->_relationships[$col]['join'] == 'local')
            {
                /* This is a many-to-one case. */
                $this->_updatedRelationships[$col] = $val;
                $this->_isDirty = true;
            }
            else
            {
                /* This is a one-to-many or many-to-many case. */
                if (!is_array($this->_updatedRelationships[$col])) $this->_updatedRelationships[$col] = array();
                array_push($this->_updatedRelationships[$col], $val);
            }
        }
        else
        {
            if (!(array_key_exists($col, $this->_data) && $this->_data[$col] === $val))
            {
                $this->_updatedData[$col] = $val;
                $this->_isDirty = true;
            }
        }
    }
    
    /**
     * Compares equality between this entity and another entity. An entity is the same
     * if it is the same type and has the same primary key value.
     * 
     * @param Sahara_Database_Record $obj entity to test against
     * @return bool true if the entities are equal
     */
    public function equals($obj)
    {
        if ($obj === this) return true;
        if (get_class($obj) != get_class($this)) return false;
        
        if ($obj->_name != $this->_name) return false;
        if (!($obj->isPersistent() && $this->_isPersistant)) return false;
        
        return $obj->__get($this->_idColumn) === $this->_data[$this->_idColumn];
    }
    
    /**
     * Returns whether this entity is persistent.
     * 
     * @return bool true if persistent
     */
    public function isPersistent()
    {
        return $this->_isPersistant;
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
    
    /**
     * Converts any native PHP types to there SQL equivalent.
     *
     * @param mixed $val  data value
     * @return array converted data value
     */
    private static function _convertForSQL($val)
    {
        /* Booleans. */
        if (is_bool($val)) $val = $val ? chr(1) : chr(0);
        else if ($val instanceof DateTime) // Date
        {
        	$val = $val->format('Y-m-d H:i:s');
        }
        
        return $val;
    }
    
    /**
     * Converts SQL data types to more friendly PHP equivalents.
     *
     * @param mixed $val data value
     * @return mixed converted data value
     */
    private static function _convertFromSQL($val)
    {
        /* Booleans. */
        if (is_string($val) && strlen($val) == 1 && (ord($val) === 0 || ord($val) === 1))
        {
         	$val = ord($val) === 1;
        }
        else if (is_string($val) && preg_match('/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/', $val) === 1) // Dates
        {
            $val = new DateTime($val);
        }
        
        return $val;
    }
}
