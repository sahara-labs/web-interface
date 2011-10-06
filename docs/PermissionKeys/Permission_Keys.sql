/*
 * SQL patch to add a required table for permission keys. This has only been 
 * verified to work on MySQL so other database servers are unsupported.
 */

CREATE TABLE IF NOT EXISTS `user_association_redeem_keys` (
  `redeemkey` varchar(64) NOT NULL,
  `user_class_id` bigint(11) NOT NULL,
  `remaining_uses` int(11) NOT NULL,
  `home_org` varchar(255) DEFAULT NULL,
  `affliation` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`redeemkey`),
  KEY `user_class_id` (`user_class_id`)
) ENGINE=InnoDB;

ALTER TABLE `user_association_redeem_keys`
  ADD CONSTRAINT `user_association_redeem_keys_ibfk_1` FOREIGN KEY (`user_class_id`) REFERENCES `user_class` (`id`);