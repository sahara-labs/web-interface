<?php

class Sahara_Auth_Type_Ldap extends Sahara_Auth_Type
{
    /** @var Zend_Ldap Ldap. */
    private $_ldap;

    /** @var array User record from LDAP. */
    private $_userRecord;

    public function __construct()
    {
        parent::__construct();

        $ldapOpts = $this->_config->ldap->params;
        if ($ldapOpts == null)
        {
            throw new Exception('LDAP options not configured.', 102);
        }

        $ldapOpts = $ldapOpts->toArray();
        $ldapOpts['bindRequiresDn'] = true;
        $this->_ldap = new Zend_Ldap($ldapOpts);
    }

    /**
     * (non-PHPdoc)
     * @see models/Sahara/Auth/Sahara_Auth_Type::authenticate()
     */
    public function authenticate()
    {
        try
        {
            $this->_ldap->bind($this->_user, $this->_pass);
            $this->_userRecord = $this->_ldap->getEntry($this->_ldap->getBoundUser());

            if ($objClass = $this->_config->objectclass)
            {
                return in_array($objClass, $this->_userRecord->objectClass);
            }
            else
            {
                return true;
            }
        }
        catch (Exception $ex)
        {
            if ($ex->getCode() == Zend_Ldap_Exception::LDAP_NO_SUCH_OBJECT ||    // User name not known
                $ex->getCode() == Zend_Ldap_Exception::LDAP_INVALID_CREDENTIALS) // Password wrong
            {
                return false;
            }
            else
            {
                throw $ex;
            }
        }
    }

    public function getAuthInfo($property)
    {

    }

    public function __destruct()
    {
        $this->_ldap->disconnect();
    }
}