-- MySQL dump 10.11
--
-- Host: localhost    Database: sahara
-- ------------------------------------------------------
-- Server version	5.0.95

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_permission`
--

DROP TABLE IF EXISTS `academic_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `academic_permission` (
  `id` int(11) NOT NULL auto_increment,
  `can_control` bit(1) NOT NULL,
  `can_generate_reports` bit(1) NOT NULL,
  `can_kick` bit(1) NOT NULL,
  `can_modify` bit(1) NOT NULL,
  `can_view` bit(1) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `user_class_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK2DC5C40760957DDC` (`user_class_id`),
  KEY `FK2DC5C407DC2CA001` (`user_id`),
  CONSTRAINT `FK2DC5C40760957DDC` FOREIGN KEY (`user_class_id`) REFERENCES `user_class` (`id`),
  CONSTRAINT `FK2DC5C407DC2CA001` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_permission`
--

LOCK TABLES `academic_permission` WRITE;
/*!40000 ALTER TABLE `academic_permission` DISABLE KEYS */;
/*!40000 ALTER TABLE `academic_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` bigint(20) NOT NULL auto_increment,
  `active` bit(1) NOT NULL,
  `cancel_reason` varchar(1024) default NULL,
  `code_reference` varchar(1024) default NULL,
  `creation_time` datetime default NULL,
  `duration` int(11) NOT NULL,
  `end_time` datetime NOT NULL,
  `resource_type` varchar(10) NOT NULL,
  `start_time` datetime NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `user_namespace` varchar(50) NOT NULL,
  `request_caps_id` bigint(20) default NULL,
  `resource_permission_id` bigint(20) NOT NULL,
  `rig_id` bigint(20) default NULL,
  `rig_type_id` bigint(20) default NULL,
  `session_id` bigint(20) default NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK7786033A4BD618F4` (`rig_type_id`),
  KEY `FK7786033AC793D867` (`request_caps_id`),
  KEY `FK7786033A8DD270B3` (`rig_id`),
  KEY `FK7786033ADC2CA001` (`user_id`),
  KEY `FK7786033A5C779673` (`session_id`),
  KEY `FK7786033AAACFAD7E` (`resource_permission_id`),
  CONSTRAINT `FK7786033A4BD618F4` FOREIGN KEY (`rig_type_id`) REFERENCES `rig_type` (`id`),
  CONSTRAINT `FK7786033A5C779673` FOREIGN KEY (`session_id`) REFERENCES `session` (`id`),
  CONSTRAINT `FK7786033A8DD270B3` FOREIGN KEY (`rig_id`) REFERENCES `rig` (`id`),
  CONSTRAINT `FK7786033AAACFAD7E` FOREIGN KEY (`resource_permission_id`) REFERENCES `resource_permission` (`id`),
  CONSTRAINT `FK7786033AC793D867` FOREIGN KEY (`request_caps_id`) REFERENCES `request_capabilities` (`id`),
  CONSTRAINT `FK7786033ADC2CA001` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config` (
  `id` int(11) NOT NULL auto_increment,
  `config_key` varchar(200) NOT NULL,
  `value` varchar(1024) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matching_capabilities`
--

DROP TABLE IF EXISTS `matching_capabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `matching_capabilities` (
  `request_capabilities` bigint(20) NOT NULL,
  `rig_capabilities` bigint(20) NOT NULL,
  PRIMARY KEY  (`request_capabilities`,`rig_capabilities`),
  UNIQUE KEY `rig_capabilities` (`rig_capabilities`,`request_capabilities`),
  KEY `FK475FF0B8FCA6AAE4` (`rig_capabilities`),
  KEY `FK475FF0B84E80A644` (`request_capabilities`),
  CONSTRAINT `FK475FF0B84E80A644` FOREIGN KEY (`request_capabilities`) REFERENCES `request_capabilities` (`id`),
  CONSTRAINT `FK475FF0B8FCA6AAE4` FOREIGN KEY (`rig_capabilities`) REFERENCES `rig_capabilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matching_capabilities`
--

LOCK TABLES `matching_capabilities` WRITE;
/*!40000 ALTER TABLE `matching_capabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `matching_capabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_capabilities`
--

DROP TABLE IF EXISTS `request_capabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `request_capabilities` (
  `id` bigint(20) NOT NULL auto_increment,
  `capabilities` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `capabilities` (`capabilities`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_capabilities`
--

LOCK TABLES `request_capabilities` WRITE;
/*!40000 ALTER TABLE `request_capabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `request_capabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resource_permission`
--

DROP TABLE IF EXISTS `resource_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resource_permission` (
  `id` bigint(20) NOT NULL auto_increment,
  `use_activity_detection` bit(1) NOT NULL,
  `allowed_extensions` smallint(6) NOT NULL,
  `display_name` varchar(255) default NULL,
  `expiry_time` datetime NOT NULL,
  `extension_duration` int(11) NOT NULL,
  `maximum_bookings` int(11) NOT NULL default '0',
  `queue_activity_timeout` int(11) NOT NULL,
  `session_activity_timeout` int(11) NOT NULL,
  `session_duration` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `type` varchar(10) NOT NULL,
  `request_caps_id` bigint(20) default NULL,
  `name_id` bigint(20) default NULL,
  `type_id` bigint(20) default NULL,
  `user_class_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK3BCCE2A060957DDC` (`user_class_id`),
  KEY `FK3BCCE2A0C793D867` (`request_caps_id`),
  KEY `FK3BCCE2A097C6C923` (`type_id`),
  KEY `FK3BCCE2A02BF4F958` (`name_id`),
  CONSTRAINT `FK3BCCE2A02BF4F958` FOREIGN KEY (`name_id`) REFERENCES `rig` (`id`),
  CONSTRAINT `FK3BCCE2A060957DDC` FOREIGN KEY (`user_class_id`) REFERENCES `user_class` (`id`),
  CONSTRAINT `FK3BCCE2A097C6C923` FOREIGN KEY (`type_id`) REFERENCES `rig_type` (`id`),
  CONSTRAINT `FK3BCCE2A0C793D867` FOREIGN KEY (`request_caps_id`) REFERENCES `request_capabilities` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_permission`
--

LOCK TABLES `resource_permission` WRITE;
/*!40000 ALTER TABLE `resource_permission` DISABLE KEYS */;
INSERT INTO `resource_permission` VALUES (1,'',2,NULL,'2012-05-31 00:00:00',900,3,180,600,1800,'2012-05-01 00:00:00','TYPE',NULL,NULL,1,1);
/*!40000 ALTER TABLE `resource_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rig`
--

DROP TABLE IF EXISTS `rig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rig` (
  `id` bigint(20) NOT NULL auto_increment,
  `active` bit(1) NOT NULL,
  `contact_url` varchar(1024) default NULL,
  `in_session` bit(1) NOT NULL,
  `last_update_timestamp` datetime NOT NULL,
  `managed` bit(1) NOT NULL,
  `meta` varchar(255) default NULL,
  `name` varchar(50) NOT NULL,
  `offline_reason` varchar(255) default NULL,
  `online` bit(1) NOT NULL,
  `caps_id` bigint(20) NOT NULL,
  `type_id` bigint(20) NOT NULL,
  `session_id` bigint(20) default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  KEY `FK1B910C571AF98` (`caps_id`),
  KEY `FK1B91097C6C923` (`type_id`),
  KEY `FK1B9105C779673` (`session_id`),
  CONSTRAINT `FK1B9105C779673` FOREIGN KEY (`session_id`) REFERENCES `session` (`id`),
  CONSTRAINT `FK1B91097C6C923` FOREIGN KEY (`type_id`) REFERENCES `rig_type` (`id`),
  CONSTRAINT `FK1B910C571AF98` FOREIGN KEY (`caps_id`) REFERENCES `rig_capabilities` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rig`
--

LOCK TABLES `rig` WRITE;
/*!40000 ALTER TABLE `rig` DISABLE KEYS */;
INSERT INTO `rig` VALUES (1,'','http://172.17.113.10:8081/services/RigClientService','\0','2012-06-18 12:26:05','',NULL,'MRI_FHS_1',NULL,'',1,1,NULL);
/*!40000 ALTER TABLE `rig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rig_capabilities`
--

DROP TABLE IF EXISTS `rig_capabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rig_capabilities` (
  `id` bigint(20) NOT NULL auto_increment,
  `capabilities` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `capabilities` (`capabilities`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rig_capabilities`
--

LOCK TABLES `rig_capabilities` WRITE;
/*!40000 ALTER TABLE `rig_capabilities` DISABLE KEYS */;
INSERT INTO `rig_capabilities` VALUES (1,'imaging,mri');
/*!40000 ALTER TABLE `rig_capabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rig_log`
--

DROP TABLE IF EXISTS `rig_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rig_log` (
  `id` bigint(20) NOT NULL auto_increment,
  `new_state` varchar(20) NOT NULL,
  `old_state` varchar(20) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL,
  `rig_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK478B83958DD270B3` (`rig_id`),
  CONSTRAINT `FK478B83958DD270B3` FOREIGN KEY (`rig_id`) REFERENCES `rig` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rig_log`
--

LOCK TABLES `rig_log` WRITE;
/*!40000 ALTER TABLE `rig_log` DISABLE KEYS */;
INSERT INTO `rig_log` VALUES (1,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-03 10:15:53',1),(2,'ONLINE','OFFLINE','Rig came online.','2012-05-03 10:15:53',1),(3,'NOT_REGISTERED','OFFLINE','Timed out.','2012-05-03 10:19:11',1),(4,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-03 10:20:42',1),(5,'ONLINE','OFFLINE','Rig came online.','2012-05-03 10:20:42',1),(6,'OFFLINE','ONLINE','Allocation failed with error: Connection timed out','2012-05-03 11:14:39',1),(7,'ONLINE','OFFLINE','Rig came online.','2012-05-03 11:14:47',1),(8,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-03 11:17:07',1),(9,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-03 11:34:18',1),(10,'ONLINE','OFFLINE','Rig came online.','2012-05-03 11:34:18',1),(11,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-04 02:59:46',1),(12,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-04 03:02:39',1),(13,'ONLINE','OFFLINE','Rig came online.','2012-05-04 03:02:39',1),(14,'NOT_REGISTERED','OFFLINE','Timed out.','2012-05-04 12:12:41',1),(15,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-04 12:14:25',1),(16,'ONLINE','OFFLINE','Rig came online.','2012-05-04 12:14:25',1),(17,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-05 02:59:47',1),(18,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-05 03:02:37',1),(19,'ONLINE','OFFLINE','Rig came online.','2012-05-05 03:02:37',1),(20,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-09 11:26:34',1),(21,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-09 13:12:59',1),(22,'ONLINE','OFFLINE','Rig came online.','2012-05-09 13:12:59',1),(23,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-10 02:59:41',1),(24,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-10 03:02:30',1),(25,'ONLINE','OFFLINE','Rig came online.','2012-05-10 03:02:30',1),(26,'NOT_REGISTERED','OFFLINE','Timed out.','2012-05-10 11:29:04',1),(27,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-10 11:29:35',1),(28,'ONLINE','OFFLINE','Rig came online.','2012-05-10 11:29:35',1),(29,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-11 02:59:43',1),(30,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-11 03:02:30',1),(31,'ONLINE','OFFLINE','Rig came online.','2012-05-11 03:02:30',1),(32,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-12 02:59:32',1),(33,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-12 03:02:11',1),(34,'ONLINE','OFFLINE','Rig came online.','2012-05-12 03:02:11',1),(35,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-13 02:59:31',1),(36,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-13 03:02:02',1),(37,'ONLINE','OFFLINE','Rig came online.','2012-05-13 03:02:02',1),(38,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-14 02:59:26',1),(39,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-14 03:02:00',1),(40,'ONLINE','OFFLINE','Rig came online.','2012-05-14 03:02:00',1),(41,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-15 02:59:24',1),(42,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-15 03:01:54',1),(43,'ONLINE','OFFLINE','Rig came online.','2012-05-15 03:01:54',1),(44,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-16 02:59:23',1),(45,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-16 03:01:56',1),(46,'ONLINE','OFFLINE','Rig came online.','2012-05-16 03:01:56',1),(47,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-17 02:59:19',1),(48,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-17 03:01:48',1),(49,'ONLINE','OFFLINE','Rig came online.','2012-05-17 03:01:48',1),(50,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-18 02:59:17',1),(51,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-18 03:01:44',1),(52,'ONLINE','OFFLINE','Rig came online.','2012-05-18 03:01:44',1),(53,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-18 08:52:34',1),(54,'ONLINE','OFFLINE','Rig came online.','2012-05-18 08:52:34',1),(55,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-18 09:38:23',1),(56,'ONLINE','OFFLINE','Rig came online.','2012-05-18 09:38:23',1),(57,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-18 09:56:41',1),(58,'ONLINE','OFFLINE','Rig came online.','2012-05-18 09:56:41',1),(59,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-18 11:05:31',1),(60,'ONLINE','OFFLINE','Rig came online.','2012-05-18 11:05:31',1),(61,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-18 11:52:18',1),(62,'ONLINE','OFFLINE','Rig came online.','2012-05-18 11:52:18',1),(63,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-19 02:59:18',1),(64,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-19 03:01:46',1),(65,'ONLINE','OFFLINE','Rig came online.','2012-05-19 03:01:46',1),(66,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-20 02:59:15',1),(67,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-20 03:01:45',1),(68,'ONLINE','OFFLINE','Rig came online.','2012-05-20 03:01:45',1),(69,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-21 02:59:13',1),(70,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-21 03:01:41',1),(71,'ONLINE','OFFLINE','Rig came online.','2012-05-21 03:01:41',1),(72,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-21 09:57:54',1),(73,'ONLINE','OFFLINE','Rig came online.','2012-05-21 09:57:54',1),(74,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-21 10:40:45',1),(75,'ONLINE','OFFLINE','Rig came online.','2012-05-21 10:40:45',1),(76,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-22 02:59:10',1),(77,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-22 03:02:46',1),(78,'ONLINE','OFFLINE','Rig came online.','2012-05-22 03:02:47',1),(79,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-23 02:59:10',1),(80,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-23 03:01:39',1),(81,'ONLINE','OFFLINE','Rig came online.','2012-05-23 03:01:39',1),(82,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-24 02:59:07',1),(83,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-24 03:01:43',1),(84,'ONLINE','OFFLINE','Rig came online.','2012-05-24 03:01:43',1),(85,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-25 02:59:06',1),(86,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-25 03:01:42',1),(87,'ONLINE','OFFLINE','Rig came online.','2012-05-25 03:01:42',1),(88,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-26 02:59:01',1),(89,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-26 03:01:43',1),(90,'ONLINE','OFFLINE','Rig came online.','2012-05-26 03:01:43',1),(91,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-27 02:59:00',1),(92,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-27 03:01:39',1),(93,'ONLINE','OFFLINE','Rig came online.','2012-05-27 03:01:39',1),(94,'NOT_REGISTERED','ONLINE','Rig removed its registration.','2012-05-28 02:58:57',1),(95,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-05-28 03:02:54',1),(96,'ONLINE','OFFLINE','Rig came online.','2012-05-28 03:02:54',1),(97,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-01 14:31:09',1),(98,'ONLINE','OFFLINE','Rig came online.','2012-06-01 14:31:09',1),(99,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-01 14:34:26',1),(100,'ONLINE','OFFLINE','Rig came online.','2012-06-01 14:34:26',1),(101,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-07 08:50:38',1),(102,'ONLINE','OFFLINE','Rig came online.','2012-06-07 08:50:38',1),(103,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-07 08:54:21',1),(104,'ONLINE','OFFLINE','Rig came online.','2012-06-07 08:54:21',1),(105,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-07 08:58:07',1),(106,'ONLINE','OFFLINE','Rig came online.','2012-06-07 08:58:07',1),(107,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-07 10:54:31',1),(108,'ONLINE','OFFLINE','Rig came online.','2012-06-07 10:54:31',1),(109,'NOT_REGISTERED','OFFLINE','Timed out.','2012-06-13 19:01:26',1),(110,'OFFLINE','NOT_REGISTERED','Rig was registered.','2012-06-13 19:02:00',1),(111,'ONLINE','OFFLINE','Rig came online.','2012-06-13 19:02:00',1);
/*!40000 ALTER TABLE `rig_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rig_offline_schedule`
--

DROP TABLE IF EXISTS `rig_offline_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rig_offline_schedule` (
  `id` bigint(20) NOT NULL auto_increment,
  `active` bit(1) NOT NULL,
  `end_time` datetime NOT NULL,
  `reason` varchar(255) NOT NULL,
  `start_time` datetime NOT NULL,
  `rig_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK1EE690C28DD270B3` (`rig_id`),
  CONSTRAINT `FK1EE690C28DD270B3` FOREIGN KEY (`rig_id`) REFERENCES `rig` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rig_offline_schedule`
--

LOCK TABLES `rig_offline_schedule` WRITE;
/*!40000 ALTER TABLE `rig_offline_schedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `rig_offline_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rig_type`
--

DROP TABLE IF EXISTS `rig_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rig_type` (
  `id` bigint(20) NOT NULL auto_increment,
  `code_assignable` bit(1) NOT NULL,
  `logoff_grace_duration` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `set_up_time` int(11) NOT NULL default '0',
  `tear_down_time` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rig_type`
--

LOCK TABLES `rig_type` WRITE;
/*!40000 ALTER TABLE `rig_type` DISABLE KEYS */;
INSERT INTO `rig_type` VALUES (1,'\0',180,'MRI',0,0);
/*!40000 ALTER TABLE `rig_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `session` (
  `id` bigint(20) NOT NULL auto_increment,
  `active` bit(1) NOT NULL,
  `activity_last_updated` datetime NOT NULL,
  `assigned_rig_name` varchar(50) default NULL,
  `assignment_time` datetime default NULL,
  `code_reference` varchar(1024) default NULL,
  `duration` int(11) NOT NULL,
  `extensions` smallint(6) NOT NULL,
  `in_grace` bit(1) default NULL,
  `priority` smallint(6) NOT NULL,
  `ready` bit(1) default NULL,
  `removal_reason` varchar(1024) default NULL,
  `removal_time` datetime default NULL,
  `request_time` datetime NOT NULL,
  `requested_resource_id` bigint(20) default NULL,
  `requested_resource_name` varchar(1024) NOT NULL,
  `resource_type` varchar(10) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `user_namespace` varchar(50) NOT NULL,
  `resource_permission_id` bigint(20) default NULL,
  `assigned_rig_id` bigint(20) default NULL,
  `user_id` bigint(20) default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK76508296DC2CA001` (`user_id`),
  KEY `FK76508296F147DC44` (`assigned_rig_id`),
  KEY `FK76508296AACFAD7E` (`resource_permission_id`),
  CONSTRAINT `FK76508296AACFAD7E` FOREIGN KEY (`resource_permission_id`) REFERENCES `resource_permission` (`id`),
  CONSTRAINT `FK76508296DC2CA001` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK76508296F147DC44` FOREIGN KEY (`assigned_rig_id`) REFERENCES `rig` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES (1,'\0','2012-05-03 11:13:14','MRI_FHS_1','2012-05-03 11:13:14',NULL,1800,2,'\0',1,'\0','Allocation failure with SOAP error \'Connection timed out\'.','2012-05-03 11:14:39','2012-05-03 11:13:14',1,'MRI','TYPE','testuser','SYD',1,1,1),(2,'\0','2012-05-03 11:38:40','MRI_FHS_1','2012-05-03 11:36:04',NULL,1800,2,'\0',1,'','User request.','2012-05-03 11:39:06','2012-05-03 11:36:04',1,'MRI','TYPE','testuser','SYD',1,1,1),(3,'\0','2012-05-03 11:42:59','MRI_FHS_1','2012-05-03 11:39:55',NULL,1800,2,'\0',1,'','User request.','2012-05-03 11:43:10','2012-05-03 11:39:55',1,'MRI','TYPE','testuser','SYD',1,1,1),(4,'\0','2012-05-03 12:09:10','MRI_FHS_1','2012-05-03 11:50:09',NULL,1800,2,'\0',1,'','User request.','2012-05-03 12:09:31','2012-05-03 11:50:09',1,'MRI','TYPE','testuser','SYD',1,1,1),(5,'\0','2012-05-03 12:09:52','MRI_FHS_1','2012-05-03 12:09:47',NULL,1800,2,'\0',1,'','User request.','2012-05-03 12:10:00','2012-05-03 12:09:47',1,'MRI','TYPE','testuser','SYD',1,1,1),(6,'\0','2012-05-03 13:09:38','MRI_FHS_1','2012-05-03 12:12:35',NULL,1800,0,'',1,'','No more session time extensions.','2012-05-03 13:12:38','2012-05-03 12:12:35',1,'MRI','TYPE','test2','SYD',1,1,2),(7,'\0','2012-05-03 13:51:26','MRI_FHS_1','2012-05-03 13:51:26',NULL,1800,2,'\0',1,'','User request.','2012-05-03 13:52:38','2012-05-03 13:51:26',1,'MRI','TYPE','testuser','SYD',1,1,1),(8,'\0','2012-05-03 14:26:45','MRI_FHS_1','2012-05-03 14:26:45',NULL,1800,2,'\0',1,'','User request.','2012-05-03 14:28:50','2012-05-03 14:26:45',1,'MRI','TYPE','testuser','SYD',1,1,1),(9,'\0','2012-05-04 11:04:55','MRI_FHS_1','2012-05-04 11:04:55',NULL,1800,2,'\0',1,'','User request.','2012-05-04 11:07:48','2012-05-04 11:04:55',1,'MRI','TYPE','testuser','SYD',1,1,1),(10,'\0','2012-05-17 12:33:14','MRI_FHS_1','2012-05-17 12:32:16',NULL,1800,2,'\0',1,'','User request.','2012-05-17 12:33:32','2012-05-17 12:32:16',1,'MRI','TYPE','eschou','SYD',1,1,3);
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_association`
--

DROP TABLE IF EXISTS `user_association`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_association` (
  `user_class_id` bigint(20) NOT NULL,
  `users_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`user_class_id`,`users_id`),
  KEY `FK9DC9CE0D60957DDC` (`user_class_id`),
  KEY `FK9DC9CE0DD51D78A4` (`users_id`),
  CONSTRAINT `FK9DC9CE0D60957DDC` FOREIGN KEY (`user_class_id`) REFERENCES `user_class` (`id`),
  CONSTRAINT `FK9DC9CE0DD51D78A4` FOREIGN KEY (`users_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_association`
--

LOCK TABLES `user_association` WRITE;
/*!40000 ALTER TABLE `user_association` DISABLE KEYS */;
INSERT INTO `user_association` VALUES (1,1),(1,2),(1,3),(1,4);
/*!40000 ALTER TABLE `user_association` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_class`
--

DROP TABLE IF EXISTS `user_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_class` (
  `id` bigint(20) NOT NULL auto_increment,
  `active` bit(1) NOT NULL,
  `bookable` bit(1) NOT NULL,
  `kickable` bit(1) NOT NULL,
  `name` varchar(50) NOT NULL,
  `priority` smallint(6) NOT NULL,
  `queuable` bit(1) NOT NULL,
  `time_horizon` int(11) NOT NULL default '0',
  `users_lockable` bit(1) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_class`
--

LOCK TABLES `user_class` WRITE;
/*!40000 ALTER TABLE `user_class` DISABLE KEYS */;
INSERT INTO `user_class` VALUES (1,'','','\0','Test',1,'',0,'\0');
/*!40000 ALTER TABLE `user_class` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_class_key`
--

DROP TABLE IF EXISTS `user_class_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_class_key` (
  `id` bigint(20) NOT NULL auto_increment,
  `active` bit(1) default NULL,
  `expiry` datetime default NULL,
  `redeem_key` varchar(255) NOT NULL,
  `remaining` int(11) default NULL,
  `user_targeted` bit(1) default NULL,
  `user_class_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `redeem_key` (`redeem_key`),
  KEY `FK5CD8DFA460957DDC` (`user_class_id`),
  CONSTRAINT `FK5CD8DFA460957DDC` FOREIGN KEY (`user_class_id`) REFERENCES `user_class` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_class_key`
--

LOCK TABLES `user_class_key` WRITE;
/*!40000 ALTER TABLE `user_class_key` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_class_key` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_class_key_constraint`
--

DROP TABLE IF EXISTS `user_class_key_constraint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_class_key_constraint` (
  `id` bigint(20) NOT NULL auto_increment,
  `name` varchar(255) NOT NULL,
  `value` varchar(1024) NOT NULL,
  `user_class_key_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  KEY `FK8E891D58C4542D6F` (`user_class_key_id`),
  CONSTRAINT `FK8E891D58C4542D6F` FOREIGN KEY (`user_class_key_id`) REFERENCES `user_class_key` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_class_key_constraint`
--

LOCK TABLES `user_class_key_constraint` WRITE;
/*!40000 ALTER TABLE `user_class_key_constraint` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_class_key_constraint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_class_key_redemption`
--

DROP TABLE IF EXISTS `user_class_key_redemption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_class_key_redemption` (
  `id` bigint(20) NOT NULL auto_increment,
  `user_class_key_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  KEY `FK14C1F1A6C4542D6F` (`user_class_key_id`),
  KEY `FK14C1F1A6DC2CA001` (`user_id`),
  CONSTRAINT `FK14C1F1A6C4542D6F` FOREIGN KEY (`user_class_key_id`) REFERENCES `user_class_key` (`id`),
  CONSTRAINT `FK14C1F1A6DC2CA001` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_class_key_redemption`
--

LOCK TABLES `user_class_key_redemption` WRITE;
/*!40000 ALTER TABLE `user_class_key_redemption` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_class_key_redemption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_lock`
--

DROP TABLE IF EXISTS `user_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_lock` (
  `id` bigint(20) NOT NULL auto_increment,
  `is_locked` bit(1) NOT NULL,
  `lock_key` varchar(50) NOT NULL,
  `resource_permission_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK1439391FDC2CA001` (`user_id`),
  KEY `FK1439391FAACFAD7E` (`resource_permission_id`),
  CONSTRAINT `FK1439391FAACFAD7E` FOREIGN KEY (`resource_permission_id`) REFERENCES `resource_permission` (`id`),
  CONSTRAINT `FK1439391FDC2CA001` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_lock`
--

LOCK TABLES `user_lock` WRITE;
/*!40000 ALTER TABLE `user_lock` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL auto_increment,
  `email` varchar(100) default NULL,
  `first_name` varchar(50) default NULL,
  `last_name` varchar(50) default NULL,
  `name` varchar(50) NOT NULL,
  `namespace` varchar(50) NOT NULL,
  `persona` varchar(8) NOT NULL,
  `auth_allowed` tinyint(1) NOT NULL default '0',
  `password` varchar(64) default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`,`namespace`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,NULL,NULL,'testuser','SYD','USER',1,'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'),(2,NULL,NULL,NULL,'test2','SYD','USER',1,'t3st'),(3,NULL,NULL,NULL,'eschou_db','SYD','USER',1,'43ae5392fbf998d028972b3e9750548fb5bd0301'),(4,NULL,NULL,NULL,'eschou','SYD','USER',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2012-06-18 12:26:31
