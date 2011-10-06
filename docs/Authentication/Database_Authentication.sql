/*
 * Patch to add required authentication fields to the SAHARA Labs
 * database. This has only been verified to work on MySQL so
 * other database servers are unsupported.
 */

ALTER TABLE `users`
ADD `auth_allowed` TINYINT (1) NOT NULL DEFAULT '0',
ADD `password` VARCHAR( 64 ) NULL;

