/*
 * Patch to add required mapping tables for SimpleSAMLphp SSO authentication.
 * This has only been verified to work on MySQL so
 * other database servers are unsupported.
 */

CREATE TABLE IF NOT EXISTS `shib_users_map` (
  `sid` varchar(255) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `home_org` varchar(255) default NULL,
  `affliation` varchar(255) default NULL,
  PRIMARY KEY  (`sid`),
  UNIQUE KEY `user_name` (`user_name`)
) ENGINE=InnoDB;

