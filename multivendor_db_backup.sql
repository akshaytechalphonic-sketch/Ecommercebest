-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: multivendor_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'India',
  `type` enum('home','work','other') NOT NULL DEFAULT 'home',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `addresses_user_id_idx` (`user_id`),
  KEY `addresses_user_is_default_idx` (`user_id`,`is_default`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (49,494,'John Office','9811111111','Tech Hub, Sector 62',NULL,'Noida','Uttar Pradesh','201309','India','work',1,'2026-10-29 11:55:42','2026-10-29 11:55:42');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(1024) NOT NULL,
  `mobile_image_url` varchar(1024) DEFAULT NULL,
  `link_url` varchar(1024) DEFAULT NULL,
  `banner_type` enum('home_hero','home_middle','home_bottom','promo_strip','popup','sidebar') NOT NULL DEFAULT 'home_hero',
  `position` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `click_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `banners_type_active_idx` (`banner_type`,`is_active`),
  KEY `banners_position_idx` (`position`),
  KEY `banners_category_id_idx` (`category_id`),
  KEY `banners_category_active_idx` (`category_id`,`is_active`),
  CONSTRAINT `banners_category_id_foreign_idx` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (1,'Test Diwali Mega Sale (Updated)','Up to 70% Off on Top Categories','Huge discounts on fashion, electronics, and home essentials','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600','/category/electronics','home_hero',1,1,NULL,NULL,1,'2026-10-24 10:30:28','2026-10-24 10:30:28',NULL),(3,'Test Diwali Mega Sale (Updated)','Up to 70% Off on Top Categories','Huge discounts on fashion, electronics, and home essentials','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600','/category/electronics','home_hero',1,1,NULL,NULL,1,'2026-10-24 10:39:00','2026-10-24 10:39:01',NULL),(5,'Test Diwali Mega Sale (Updated)','Up to 70% Off on Top Categories','Huge discounts on fashion, electronics, and home essentials','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600','/category/electronics','home_hero',1,1,NULL,NULL,1,'2026-10-24 11:12:17','2026-10-24 11:12:17',NULL),(8,'Test Diwali Mega Sale (Updated)','Up to 70% Off on Top Categories','Huge discounts on fashion, electronics, and home essentials','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600','/category/electronics','home_hero',1,1,NULL,NULL,1,'2026-10-29 11:14:41','2026-10-29 11:14:41',NULL),(11,'Test Diwali Mega Sale (Updated)','Up to 70% Off on Top Categories','Huge discounts on fashion, electronics, and home essentials','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600','/category/electronics','home_hero',1,1,NULL,NULL,1,'2026-10-29 11:57:00','2026-10-29 11:57:00',NULL),(12,'Test Category Electronics Hero','Best Smartphones & Laptops at Unbeatable Prices',NULL,'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1400',NULL,'/category/banner-test-elec-cat','home_hero',1,1,NULL,NULL,0,'2026-10-29 11:57:00','2026-10-29 11:57:00',213);
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_product` (`cart_id`,`product_id`),
  KEY `idx_cart_items_cart_id` (`cart_id`),
  KEY `idx_cart_items_product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (41,445,'2026-10-29 11:57:12','2026-10-29 11:57:12');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `banner_image` varchar(255) DEFAULT NULL,
  `thumbnail_image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_parent_id_idx` (`parent_id`),
  KEY `categories_status_idx` (`status`),
  KEY `categories_display_order_idx` (`display_order`),
  KEY `categories_created_at_idx` (`created_at`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (68,NULL,'Fashion','fashion','Trending Fashion design','http://localhost:5000/uploads/products/prod-scholaracad-prince2-enrollment-1792756971815-589572.png','http://localhost:5000/uploads/products/prod-vt-logo-1792756965278-707897.jpg','active',0,'2026-10-23 12:02:55','2026-10-23 12:02:55'),(147,NULL,'Electronics & Gadgets','electronics','Cutting edge consumer electronics, laptops, wearables and smart tech accessories','https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80','active',1,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(148,147,'Laptops & Computers','laptops-computers',NULL,NULL,NULL,'active',1,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(149,147,'Audio & Wireless Headphones','audio-headphones',NULL,NULL,NULL,'active',2,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(150,147,'Smart Watches & Wearables','smart-wearables',NULL,NULL,NULL,'active',3,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(151,68,'Men Premium Apparel','mens-apparel',NULL,NULL,NULL,'active',1,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(152,NULL,'Home, Living & Gourmet','home-kitchen','Gourmet organic pantry items, smart home appliances, and decor','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80','active',3,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(183,NULL,'Commission Test Category','comm-test-category',NULL,NULL,NULL,'active',0,'2026-10-29 06:04:15','2026-10-29 06:04:15'),(213,NULL,'Banner Test Electronics','banner-test-elec-cat','Test category for banner targeting',NULL,NULL,'active',0,'2026-10-29 11:57:00','2026-10-29 11:57:00');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `order_item_id` bigint(20) unsigned NOT NULL,
  `vendor_id` bigint(20) unsigned NOT NULL,
  `gross_amount` decimal(12,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL,
  `vendor_earning` decimal(12,2) NOT NULL,
  `status` enum('pending','available','credited','settled','refunded','cancelled') NOT NULL DEFAULT 'pending',
  `credited_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `settlement_status` enum('unsettled','settling','settled') NOT NULL DEFAULT 'unsettled',
  `settled_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `commissions_order_item_id_unique` (`order_item_id`),
  KEY `commissions_order_id_idx` (`order_id`),
  KEY `commissions_vendor_id_idx` (`vendor_id`),
  KEY `commissions_status_idx` (`status`),
  KEY `commissions_settlement_status_idx` (`settlement_status`),
  CONSTRAINT `commissions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `commissions_ibfk_2` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `commissions_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,1,170,4000.00,10.00,400.00,3600.00,'refunded','2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-28 12:12:19',0.00,4000.00,'unsettled',NULL,NULL),(2,10,10,171,4000.00,15.00,600.00,3400.00,'cancelled','2026-10-29 06:04:48','2026-10-29 06:04:48','2026-10-29 06:04:48',0.00,4000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(3,10,11,172,1000.00,10.00,100.00,900.00,'cancelled','2026-10-29 06:04:48','2026-10-29 06:04:48','2026-10-29 06:04:48',0.00,1000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(5,11,12,171,4000.00,15.00,600.00,3400.00,'cancelled','2026-10-29 06:06:52','2026-10-29 06:06:51','2026-10-29 06:06:52',0.00,4000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(6,11,13,172,1000.00,10.00,100.00,900.00,'cancelled','2026-10-29 06:06:52','2026-10-29 06:06:51','2026-10-29 06:06:52',0.00,1000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(8,12,14,171,4000.00,15.00,600.00,3400.00,'cancelled','2026-10-29 09:26:02','2026-10-29 09:26:02','2026-10-29 09:26:02',0.00,4000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(9,12,15,172,1000.00,10.00,100.00,900.00,'cancelled','2026-10-29 09:26:02','2026-10-29 09:26:02','2026-10-29 09:26:02',0.00,1000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(11,13,16,171,4000.00,15.00,600.00,3400.00,'cancelled','2026-10-29 09:26:23','2026-10-29 09:26:23','2026-10-29 09:26:23',0.00,4000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(12,13,17,172,1000.00,10.00,100.00,900.00,'cancelled','2026-10-29 09:26:23','2026-10-29 09:26:23','2026-10-29 09:26:23',0.00,1000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(14,14,18,171,4000.00,15.00,600.00,3400.00,'cancelled','2026-10-29 11:14:54','2026-10-29 11:14:53','2026-10-29 11:14:54',0.00,4000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(15,14,19,172,1000.00,10.00,100.00,900.00,'cancelled','2026-10-29 11:14:54','2026-10-29 11:14:53','2026-10-29 11:14:54',0.00,1000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(17,15,20,171,4000.00,15.00,600.00,3400.00,'cancelled','2026-10-29 11:57:12','2026-10-29 11:57:12','2026-10-29 11:57:12',0.00,4000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test'),(18,15,21,172,1000.00,10.00,100.00,900.00,'cancelled','2026-10-29 11:57:12','2026-10-29 11:57:12','2026-10-29 11:57:12',0.00,1000.00,'unsettled',NULL,'Order cancelled. Reason: Customer requested cancellation for test');
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `vendor_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `action_type` enum('increase','decrease','set','threshold_update') NOT NULL DEFAULT 'increase',
  `previous_stock` int(11) NOT NULL,
  `changed_quantity` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `inventory_logs_product_id_idx` (`product_id`),
  KEY `inventory_logs_vendor_id_idx` (`vendor_id`),
  KEY `inventory_logs_user_id_idx` (`user_id`),
  KEY `inventory_logs_created_at_idx` (`created_at`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_logs_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `vendor_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `item_status` enum('pending','confirmed','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_vendor_id_idx` (`vendor_id`),
  KEY `order_items_product_id_idx` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,170,230,2,2000.00,4000.00,'refunded','2026-10-24 11:48:09','2026-10-24 11:48:09'),(3,3,119,234,1,1299.00,1299.00,'confirmed','2026-10-28 07:02:11','2026-10-28 12:02:11'),(4,4,119,235,1,4999.00,4999.00,'confirmed','2026-10-28 04:02:11','2026-10-28 12:02:11'),(8,8,119,178,1,1800.00,1800.00,'confirmed','2026-10-27 00:02:11','2026-10-28 12:02:11'),(9,9,119,179,2,1499.00,2998.00,'confirmed','2026-10-26 12:02:11','2026-10-28 12:02:11'),(10,10,171,237,2,2000.00,4000.00,'cancelled','2026-10-29 06:04:48','2026-10-29 06:04:48'),(11,10,172,238,1,1000.00,1000.00,'cancelled','2026-10-29 06:04:48','2026-10-29 06:04:48'),(12,11,171,237,2,2000.00,4000.00,'cancelled','2026-10-29 06:06:51','2026-10-29 06:06:52'),(13,11,172,238,1,1000.00,1000.00,'cancelled','2026-10-29 06:06:51','2026-10-29 06:06:52'),(14,12,171,237,2,2000.00,4000.00,'cancelled','2026-10-29 09:26:02','2026-10-29 09:26:02'),(15,12,172,238,1,1000.00,1000.00,'cancelled','2026-10-29 09:26:02','2026-10-29 09:26:02'),(16,13,171,237,2,2000.00,4000.00,'cancelled','2026-10-29 09:26:23','2026-10-29 09:26:23'),(17,13,172,238,1,1000.00,1000.00,'cancelled','2026-10-29 09:26:23','2026-10-29 09:26:23'),(18,14,171,237,2,2000.00,4000.00,'cancelled','2026-10-29 11:14:53','2026-10-29 11:14:54'),(19,14,172,238,1,1000.00,1000.00,'cancelled','2026-10-29 11:14:53','2026-10-29 11:14:54'),(20,15,171,237,2,2000.00,4000.00,'cancelled','2026-10-29 11:57:12','2026-10-29 11:57:12'),(21,15,172,238,1,1000.00,1000.00,'cancelled','2026-10-29 11:57:12','2026-10-29 11:57:12');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `shipping_address_id` bigint(20) unsigned DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('pending','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `order_status` enum('placed','confirmed','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'placed',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `shipping_address_id` (`shipping_address_id`),
  KEY `orders_user_id_idx` (`user_id`),
  KEY `orders_order_number_idx` (`order_number`),
  KEY `orders_payment_status_idx` (`payment_status`),
  KEY `orders_order_status_idx` (`order_status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'ORD-20261024-9169',442,NULL,4000.00,0.00,0.00,0.00,'refunded','returned','Deliver in evening','2026-10-24 11:48:09','2026-10-24 11:48:09'),(2,'ORD-1256',16,NULL,2499.00,449.82,0.00,0.00,'paid','delivered','Order placed via online storefront by Demo Customer','2026-10-28 10:02:11','2026-10-28 12:02:11'),(3,'ORD-1255',58,NULL,1299.00,233.82,0.00,0.00,'paid','processing','Order placed via online storefront by aman mshra','2026-10-28 07:02:11','2026-10-28 12:02:11'),(4,'ORD-1254',365,NULL,4999.00,899.82,0.00,0.00,'paid','shipped','Order placed via online storefront by John Doe','2026-10-28 04:02:11','2026-10-28 12:02:11'),(7,'ORD-1251',16,NULL,84999.00,15299.82,0.00,0.00,'paid','confirmed','Order placed via online storefront by Demo Customer','2026-10-27 12:02:11','2026-10-28 12:02:11'),(8,'ORD-1250',58,NULL,1800.00,324.00,0.00,0.00,'paid','delivered','Order placed via online storefront by aman mshra','2026-10-27 00:02:11','2026-10-28 12:02:11'),(9,'ORD-1249',365,NULL,2998.00,539.64,0.00,0.00,'paid','delivered','Order placed via online storefront by John Doe','2026-10-26 12:02:11','2026-10-28 12:02:11'),(10,'ORD-20261029-5953',445,NULL,5000.00,0.00,0.00,0.00,'paid','cancelled','Commission test order | Cancelled: Customer requested cancellation for test','2026-10-29 06:04:48','2026-10-29 06:04:48'),(11,'ORD-20261029-6411',445,NULL,5000.00,0.00,0.00,0.00,'paid','cancelled','Commission test order | Cancelled: Customer requested cancellation for test','2026-10-29 06:06:51','2026-10-29 06:06:52'),(12,'ORD-20261029-5504',445,NULL,5000.00,0.00,0.00,0.00,'paid','cancelled','Commission test order | Cancelled: Customer requested cancellation for test','2026-10-29 09:26:02','2026-10-29 09:26:02'),(13,'ORD-20261029-2862',445,NULL,5000.00,0.00,0.00,0.00,'paid','cancelled','Commission test order | Cancelled: Customer requested cancellation for test','2026-10-29 09:26:23','2026-10-29 09:26:23'),(14,'ORD-20261029-3354',445,NULL,5000.00,0.00,0.00,0.00,'paid','cancelled','Commission test order | Cancelled: Customer requested cancellation for test','2026-10-29 11:14:53','2026-10-29 11:14:54'),(15,'ORD-20261029-4967',445,NULL,5000.00,0.00,0.00,0.00,'paid','cancelled','Commission test order | Cancelled: Customer requested cancellation for test','2026-10-29 11:57:12','2026-10-29 11:57:12');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `password_reset_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (59,491,'ca7ffb1897c14766ace49ed17328ac8037ce15020b55d2ec4df467cb2e64fac9','2026-10-29 12:10:40',1,'2026-10-29 11:55:40','2026-10-29 11:55:40','2026-10-29 11:55:40'),(60,491,'089bf1af203b35b88bdb432a83c821052a552d5be21b635545e498502393d5c0','2026-10-29 11:55:30',0,NULL,'2026-10-29 11:55:40','2026-10-29 11:55:40');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_method` enum('card','upi','netbanking','cod','wallet') NOT NULL DEFAULT 'upi',
  `gateway` varchar(50) NOT NULL DEFAULT 'razorpay',
  `transaction_id` varchar(100) DEFAULT NULL,
  `gateway_order_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `failure_reason` text DEFAULT NULL,
  `gateway_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gateway_response`)),
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `payments_order_id_idx` (`order_id`),
  KEY `payments_user_id_idx` (`user_id`),
  KEY `payments_status_idx` (`status`),
  KEY `payments_transaction_id_idx` (`transaction_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,442,4000.00,'INR','upi','razorpay','TXN-TEST-1792842489359',NULL,'refunded',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-24T11:48:09.365Z\"}','2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-24 11:48:09'),(2,2,16,2499.00,'INR','upi','razorpay','TXN_ORD-1256_UPI','rzp_order_ORD-1256','completed',NULL,NULL,'2026-10-28 10:02:11','2026-10-28 10:02:11','2026-10-28 12:02:11'),(3,3,58,1299.00,'INR','card','razorpay','TXN_ORD-1255_CARD','rzp_order_ORD-1255','completed',NULL,NULL,'2026-10-28 07:02:11','2026-10-28 07:02:11','2026-10-28 12:02:11'),(4,4,365,4999.00,'INR','netbanking','razorpay','TXN_ORD-1254_NETBANKING','rzp_order_ORD-1254','completed',NULL,NULL,'2026-10-28 04:02:11','2026-10-28 04:02:11','2026-10-28 12:02:11'),(7,7,16,84999.00,'INR','card','razorpay','TXN_ORD-1251_CARD','rzp_order_ORD-1251','completed',NULL,NULL,'2026-10-27 12:02:11','2026-10-27 12:02:11','2026-10-28 12:02:11'),(8,8,58,1800.00,'INR','wallet','razorpay','TXN_ORD-1250_WALLET','rzp_order_ORD-1250','completed',NULL,NULL,'2026-10-27 00:02:11','2026-10-27 00:02:11','2026-10-28 12:02:11'),(9,9,365,2998.00,'INR','upi','razorpay','TXN_ORD-1249_UPI','rzp_order_ORD-1249','completed',NULL,NULL,'2026-10-26 12:02:11','2026-10-26 12:02:11','2026-10-28 12:02:11'),(10,10,445,5000.00,'INR','card','stripe','txn_test_1793253888226',NULL,'completed',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-29T06:04:48.239Z\"}','2026-10-29 06:04:48','2026-10-29 06:04:48','2026-10-29 06:04:48'),(11,11,445,5000.00,'INR','card','stripe','txn_test_1793254012275',NULL,'completed',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-29T06:06:52.286Z\"}','2026-10-29 06:06:52','2026-10-29 06:06:52','2026-10-29 06:06:52'),(12,12,445,5000.00,'INR','card','stripe','txn_test_1793265962075',NULL,'completed',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-29T09:26:02.089Z\"}','2026-10-29 09:26:02','2026-10-29 09:26:02','2026-10-29 09:26:02'),(13,13,445,5000.00,'INR','card','stripe','txn_test_1793265983191',NULL,'completed',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-29T09:26:23.208Z\"}','2026-10-29 09:26:23','2026-10-29 09:26:23','2026-10-29 09:26:23'),(14,14,445,5000.00,'INR','card','stripe','txn_test_1793272494350',NULL,'completed',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-29T11:14:54.362Z\"}','2026-10-29 11:14:54','2026-10-29 11:14:54','2026-10-29 11:14:54'),(15,15,445,5000.00,'INR','card','stripe','txn_test_1793275032772',NULL,'completed',NULL,'{\"simulated\":true,\"timestamp\":\"2026-10-29T11:57:12.783Z\"}','2026-10-29 11:57:12','2026-10-29 11:57:12','2026-10-29 11:57:12');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `vendor_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `subcategory_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `sku` varchar(100) NOT NULL,
  `stock` int(10) unsigned NOT NULL DEFAULT 0,
  `low_stock_threshold` int(10) unsigned NOT NULL DEFAULT 5,
  `status` enum('active','inactive','draft') NOT NULL DEFAULT 'active',
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  UNIQUE KEY `products_sku_unique` (`sku`),
  KEY `products_vendor_id_idx` (`vendor_id`),
  KEY `products_category_id_idx` (`category_id`),
  KEY `products_subcategory_id_idx` (`subcategory_id`),
  KEY `products_status_idx` (`status`),
  KEY `products_approval_status_idx` (`approval_status`),
  KEY `products_created_at_idx` (`created_at`),
  KEY `products_low_stock_threshold_idx` (`low_stock_threshold`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`subcategory_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (178,119,152,NULL,'Organic Kashmiri Walnut Kernels Vacuum Sealed 1kg','organic-kashmiri-walnut-kernels-1kg','Handpicked Grade-A raw walnut halves grown in high-altitude Kashmiri orchards. Zero additives, pure crunch, and packed with Omega-3.','[\"https://images.unsplash.com/photo-1557089851-f7035bf4041b?w=800&auto=format&fit=crop&q=80\"]',1800.00,1450.00,'GROC-WALNUT-1KG',85,10,'active','approved',NULL,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(179,119,152,NULL,'Cold Pressed Extra Virgin Spanish Olive Oil 1L','cold-pressed-extra-virgin-olive-oil-1l','First cold pressed unfiltered extra virgin olive oil made from single-estate Picual olives with low acidity and robust fruity aroma.','[\"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80\"]',1499.00,1199.00,'GROC-OLIVEOIL-1L',22,6,'active','approved',NULL,'2026-10-24 05:24:11','2026-10-24 05:24:11'),(230,170,68,NULL,'Wireless Pro Headphones','wireless-pro-headphones',NULL,'[]',2000.00,NULL,'HEADPHONES-PRO-001',50,5,'active','approved',NULL,'2026-10-24 11:47:33','2026-10-24 11:48:09'),(233,119,68,NULL,'Organic Darjeeling First Flush Green Tea 500g','organic-darjeeling-first-flush-green-tea','Directly sourced fresh harvest single-estate antioxidant rich Darjeeling loose leaf green tea.','[\"https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500&auto=format&fit=crop&q=80\"]',760.00,699.00,'GROC-TEA-003',80,5,'active','approved',NULL,'2026-10-28 12:02:11','2026-10-28 12:02:11'),(234,119,68,NULL,'Premium Cotton Oxford Slim-Fit Shirt','premium-cotton-oxford-slim-fit-shirt','Tailored 100% breathable organic cotton classic shirt for formal and casual occasions.','[\"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80\"]',1299.00,1149.00,'FASH-SHIRT-004',50,5,'active','approved',NULL,'2026-10-28 12:02:11','2026-10-28 12:02:11'),(235,119,68,NULL,'Ceramic Non-Stick Induction Cookware Set','ceramic-non-stick-cookware-set','Toxin-free healthy non-stick 3-piece granite induction cookware with soft-touch wood handles.','[\"https://images.unsplash.com/photo-1584990347449-39904791334c?w=500&auto=format&fit=crop&q=80\"]',4999.00,4499.00,'HOME-COOK-005',25,5,'active','approved',NULL,'2026-10-28 12:02:11','2026-10-28 12:02:11'),(237,171,183,NULL,'Premium Wireless Headphones','comm-test-p1-headphones',NULL,'[]',2000.00,NULL,'COMM-TEST-P1',50,5,'active','approved',NULL,'2026-10-29 06:04:48','2026-10-29 11:57:12'),(238,172,183,NULL,'Node.js Mastery Book','comm-test-p2-book',NULL,'[]',1000.00,NULL,'COMM-TEST-P2',40,5,'active','approved',NULL,'2026-10-29 06:04:48','2026-10-29 11:57:12');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `replaced_by_token_hash` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `refresh_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=368 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (36,16,'6af25bf4295f066ed1b3953f8e667082ddd59c037af0b2040399874c74a5481d','2026-10-26 06:00:37','2026-10-19 06:12:11',NULL,NULL,NULL,'2026-10-19 06:00:37','2026-10-19 06:12:11'),(44,20,'f156545865f58fb38410ba61b782e2628fefe1af13d91da3965ce0604e854197','2026-10-26 06:03:15','2026-10-19 06:17:32',NULL,NULL,NULL,'2026-10-19 06:03:15','2026-10-19 06:17:32'),(45,20,'70032c868e3eb4bd6458717031b201b6e99448002eeebdbb49ea7bbfbedb1d86','2026-10-26 06:17:34','2026-10-19 06:38:49','b2261dcfd209aabe2574733b409acec1dbacc41b31270c9e482683618311c648','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 06:17:34','2026-10-19 06:38:49'),(63,20,'38944ea9bc9a686c3f8f590b11a429f2fc9fe7b96978cabbfd4710638d6c50fd','2026-10-26 06:38:50',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 06:38:50','2026-10-19 06:38:50'),(64,20,'b2261dcfd209aabe2574733b409acec1dbacc41b31270c9e482683618311c648','2026-10-26 06:38:50','2026-10-19 06:56:51','82ddfa89c48df73ac50760eb837b61dc5031636b3639ec0325937a8a625d4d12','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 06:38:50','2026-10-19 06:56:51'),(75,20,'aec9addd4e9daf606ffe73c39283e8589df014bdafef2e689678ef490bcd0cc3','2026-10-26 06:56:51',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 06:56:51','2026-10-19 06:56:51'),(76,20,'82ddfa89c48df73ac50760eb837b61dc5031636b3639ec0325937a8a625d4d12','2026-10-26 06:56:51','2026-10-19 07:52:47','c6bcb7693c0733bcfa174320b809b4255e35d3798d9bc3c933b428c139eef580','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 06:56:51','2026-10-19 07:52:47'),(96,58,'0fc66aa97082ecd5cb03412a62c55fd2fe3bd7720fc4b87840604233b8116d5c','2026-10-26 07:27:22',NULL,NULL,NULL,NULL,'2026-10-19 07:27:22','2026-10-19 07:27:22'),(97,58,'9dc0ff57abd0ad53a37069b7c8cd0a1383f2f9c0867cc153deafaee867c9e201','2026-10-26 07:28:20',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 07:28:20','2026-10-19 07:28:20'),(107,20,'c15d4b8b7fa282eca9f5f2bae22d9fef6f65b80b42c8f68284b54abf18e45b8c','2026-10-26 07:52:47',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 07:52:47','2026-10-19 07:52:47'),(108,20,'c6bcb7693c0733bcfa174320b809b4255e35d3798d9bc3c933b428c139eef580','2026-10-26 07:52:47',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0','::1','2026-10-19 07:52:47','2026-10-19 07:52:47'),(118,83,'4e06ae0713f2333b6d17c8fe46d95161962953c03bef9dba7ad03855e15b6aff','2026-10-30 07:30:41','2026-10-24 09:48:24',NULL,NULL,NULL,'2026-10-23 07:30:41','2026-10-24 09:48:24'),(119,83,'0374c4356026c6dcc5dcafbdd85b6df57200f696316155f86607a06bdadc75cb','2026-10-30 07:31:12','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 07:31:12','2026-10-24 09:48:24'),(120,83,'0d0ff2a94edebab73eee6bb57c18c590314454de1101e149856d3cf867446eeb','2026-10-30 07:32:18','2026-10-23 07:50:50','8c2181bf2ea5387cbe4e2236567be9a7bd18538b1f9c3f30e13965569c7d2f75','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 07:32:18','2026-10-23 07:50:50'),(130,83,'430bf758eb44d93dd45a6f12d4bbf537f00734274b4891f2d440ee701eaa0190','2026-10-30 07:50:51','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 07:50:51','2026-10-24 09:48:24'),(131,83,'8c2181bf2ea5387cbe4e2236567be9a7bd18538b1f9c3f30e13965569c7d2f75','2026-10-30 07:50:51','2026-10-23 09:13:54','43c0e371e42bfaa6992dd001db86ec691466d44fa003c3a0f55716d5c5cf1e47','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 07:50:51','2026-10-23 09:13:54'),(150,83,'432cab515ea162d504dc86105ffedbc46a68889c9e102fe4bd8295d77702d4c5','2026-10-30 09:13:54','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:13:54','2026-10-24 09:48:24'),(151,83,'43c0e371e42bfaa6992dd001db86ec691466d44fa003c3a0f55716d5c5cf1e47','2026-10-30 09:13:54','2026-10-23 09:30:07','195cd5850cc091af14b3145e227db621c141db6afd814cfdd8e5d82b7e3c511e','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:13:54','2026-10-23 09:30:07'),(152,83,'67dc38950d62b2f85d1e1c08bbb99f29c0ea1da3a4da9f1f1ec0f086a72ffd5d','2026-10-30 09:30:07','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:30:07','2026-10-24 09:48:24'),(153,83,'ba719bc9358d9bee9dc7991aeae79666b23eeded26b0e9c34760e066b5a1c3e0','2026-10-30 09:30:08','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:30:08','2026-10-24 09:48:24'),(154,83,'195cd5850cc091af14b3145e227db621c141db6afd814cfdd8e5d82b7e3c511e','2026-10-30 09:30:08','2026-10-23 09:54:30','7874103fe15135cb43ff140a63a3f7b42ea8bf9b2a1c1f9dad3fde283581f4b5','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:30:08','2026-10-23 09:54:30'),(155,83,'c1cb76368eb39b66259b13dc937f1de693970926edb4567371ed236568af9511','2026-10-30 09:30:08','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:30:08','2026-10-24 09:48:24'),(174,83,'9e3a698a256994c1258216328fe3a2a1527dae928314272e42d72e7bfd5f4a6d','2026-10-30 09:54:30','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:54:30','2026-10-24 09:48:24'),(175,83,'7874103fe15135cb43ff140a63a3f7b42ea8bf9b2a1c1f9dad3fde283581f4b5','2026-10-30 09:54:30','2026-10-23 10:10:20','770d20dec3e905ee5c54f001b33a45aa35cbf20e49d56db54be3439a887b916a','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 09:54:30','2026-10-23 10:10:20'),(176,83,'6218bbc7692803538886d8744af9d150abd152de2b4b9e1f8c12bb9920f98f1f','2026-10-30 10:10:20','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 10:10:20','2026-10-24 09:48:24'),(177,83,'770d20dec3e905ee5c54f001b33a45aa35cbf20e49d56db54be3439a887b916a','2026-10-30 10:10:20','2026-10-23 10:29:06','0eac39e4b3a55fcd11d69f6bab47d68b60fc00eca75b14c0afb67176d4194f2b','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 10:10:20','2026-10-23 10:29:06'),(187,83,'206fa3b7ac758fec6e6042d67898b6746584d61bac2fd42226eae4ea88fa3207','2026-10-30 10:29:06','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 10:29:06','2026-10-24 09:48:24'),(188,83,'474dd454ca7f90b097e895e375dbe50b372b0454ec95cf11dbfde8d4cd4ce785','2026-10-30 10:29:06','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 10:29:06','2026-10-24 09:48:24'),(189,83,'6cf1c8a5bbaba6f2d92dc1dcccb481ec1ceaa6a40e41507a8e39214000d2735a','2026-10-30 10:29:06','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 10:29:06','2026-10-24 09:48:24'),(190,83,'0eac39e4b3a55fcd11d69f6bab47d68b60fc00eca75b14c0afb67176d4194f2b','2026-10-30 10:29:06','2026-10-23 11:11:20','810ac1ac5e44e4db8edf168af316d50a424762704113381ccf7fd2841452bf76','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 10:29:06','2026-10-23 11:11:20'),(191,83,'55dd1db533912d86977b735d8bb401f2c4626bb36897881a10eaf301e53332ac','2026-10-30 11:11:20','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 11:11:20','2026-10-24 09:48:24'),(192,83,'810ac1ac5e44e4db8edf168af316d50a424762704113381ccf7fd2841452bf76','2026-10-30 11:11:20','2026-10-23 11:59:10','fa9516c80fbaf7fc69676dd88abc89f627f702e968636daad3e8eb25e4995605','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 11:11:20','2026-10-23 11:59:10'),(193,83,'9aed5be4cc130ecf176866dd8deb7597851103b966377f7ca717df983d851ebc','2026-10-30 11:59:10','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 11:59:10','2026-10-24 09:48:24'),(194,83,'fa9516c80fbaf7fc69676dd88abc89f627f702e968636daad3e8eb25e4995605','2026-10-30 11:59:10','2026-10-23 12:17:31','9e52ff543d24ddad4554725be0d9d36e6f1cbba3991ee971531feb2ed64fea5d','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 11:59:10','2026-10-23 12:17:31'),(204,83,'c3902e003cda198e941cf1aca8da4bff4fab3080b293b9d5d9ba9324cc238103','2026-10-30 12:17:31','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 12:17:31','2026-10-24 09:48:24'),(205,83,'9e52ff543d24ddad4554725be0d9d36e6f1cbba3991ee971531feb2ed64fea5d','2026-10-30 12:17:31','2026-10-23 12:37:26','629be91eb14ec961402e768bc3b7fc3ac0ed605dde3ca80643913c9f07cfefbf','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 12:17:31','2026-10-23 12:37:26'),(215,83,'f64109b885cb169e9131d00f0563369c6b9fe8757d8cfaf54a0d6177eddcbb23','2026-10-30 12:37:26','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 12:37:26','2026-10-24 09:48:24'),(216,83,'629be91eb14ec961402e768bc3b7fc3ac0ed605dde3ca80643913c9f07cfefbf','2026-10-30 12:37:26','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 12:37:26','2026-10-24 09:48:24'),(235,83,'8bd40a5cd4a39a22b8473dc53d6f1d15072dc0d887e4735a877fb83aa15623aa','2026-10-30 13:10:09','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 13:10:09','2026-10-24 09:48:24'),(236,83,'31c82adabc645ec5e99b8d5f57676fc0f036a55e95f739363096a453d8fd626a','2026-10-30 13:18:19','2026-10-23 15:58:00','39e6294cf95593a0ddc26dd7bba718978167974d040674838e617a1f3dd4facf','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 13:18:19','2026-10-23 15:58:00'),(237,83,'b8e326e9fa1f60b28c24132e75da5b7130d09228ac3e06bf9300d06552ed64ed','2026-10-30 15:58:00','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 15:58:00','2026-10-24 09:48:24'),(238,83,'39e6294cf95593a0ddc26dd7bba718978167974d040674838e617a1f3dd4facf','2026-10-30 15:58:00','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-23 15:58:00','2026-10-24 09:48:24'),(239,83,'006f26bcf19cb79178b813d51c9804014a84e882f6c1665fa87a7d51f6db1ce0','2026-10-31 04:53:32','2026-10-24 05:12:29','4166cdd6f9edcce40222c3ff09704776a517da9df2289fae3154a25c912d4428','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 04:53:32','2026-10-24 05:12:29'),(249,83,'9e005de07bfda0a7fb454e8efd358f86d0c4ba90f2ffb51144bc3bd40054d826','2026-10-31 05:12:30','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 05:12:30','2026-10-24 09:48:24'),(250,83,'4166cdd6f9edcce40222c3ff09704776a517da9df2289fae3154a25c912d4428','2026-10-31 05:12:30','2026-10-24 05:15:42',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 05:12:30','2026-10-24 05:15:42'),(251,332,'fb2ab9bc5a7d0e7619373f7f3311f149f21eba5f8807c5824875ea106dded579','2026-10-31 05:16:24','2026-10-24 05:24:52',NULL,NULL,NULL,'2026-10-24 05:16:24','2026-10-24 05:24:52'),(261,365,'01b3450e788391d400ce0d41c9803143ee4b78e9c82d8fca6cee461726b40abf','2026-10-31 05:48:23','2026-10-24 06:03:26','e6ca459db8e3f31614e977db259ae1adfbdbfe9d16691cb7d8cb72735dc4e94a',NULL,NULL,'2026-10-24 05:48:23','2026-10-24 06:03:26'),(262,365,'b780ec503b4d9386413b9b461f03dc610a0c602a939fa83e3f64bf5141e8cbb7','2026-10-31 06:03:27','2026-10-24 06:37:02','a3ff1ab3312593d0f4b81de141fd6d691cd1e5b0fee7c17b1f7b429d31fe6fa7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 06:03:27','2026-10-24 06:37:02'),(263,365,'e6ca459db8e3f31614e977db259ae1adfbdbfe9d16691cb7d8cb72735dc4e94a','2026-10-31 06:03:27','2026-10-24 08:44:32',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 06:03:27','2026-10-24 08:44:32'),(264,365,'4ec3924cf732030db3aaebda89b926506c1b86335bedf421ec96119848c7afc6','2026-10-31 06:37:02','2026-10-24 08:44:32',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 06:37:02','2026-10-24 08:44:32'),(265,365,'a3ff1ab3312593d0f4b81de141fd6d691cd1e5b0fee7c17b1f7b429d31fe6fa7','2026-10-31 06:37:02','2026-10-24 08:02:09','fde11ebfab0f2aedbd0317e6c5ba32662fbac923e0ebe9b9586b53f64592cd87','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 06:37:02','2026-10-24 08:02:09'),(266,365,'5a94452de29017134be37ae7cef1d69bb75990ac4ddff943a8a8482d28655914','2026-10-31 08:02:09','2026-10-24 08:44:32',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 08:02:09','2026-10-24 08:44:32'),(267,365,'a5b07919778b7b7b7da5337eebbdbc1babc697ac20bb01685eeb1cf2d9eb153a','2026-10-31 08:02:09','2026-10-24 08:44:32',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 08:02:09','2026-10-24 08:44:32'),(268,365,'78efa1f4a3a25f83f05a02a8a7663379ff8df9f8fceff51a18de79075ce0633e','2026-10-31 08:02:09','2026-10-24 08:44:32',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 08:02:09','2026-10-24 08:44:32'),(269,365,'fde11ebfab0f2aedbd0317e6c5ba32662fbac923e0ebe9b9586b53f64592cd87','2026-10-31 08:02:09','2026-10-24 08:44:32','3dd9e2c06a5ef6b5007cc14276f59e244dea7d77243b6a94b38dd8e450650dea','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 08:02:09','2026-10-24 08:44:32'),(270,365,'3dd9e2c06a5ef6b5007cc14276f59e244dea7d77243b6a94b38dd8e450650dea','2026-10-31 08:44:32','2026-10-24 08:44:32',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 08:44:32','2026-10-24 08:44:32'),(271,83,'c60c6d4f09156145c4988f4c154af448435bf2728808c9c3475dcb1d28e37cfe','2026-10-31 09:10:31','2026-10-24 09:30:38','40ae6eaa365c48d5d4373f7f61845af5e12eb7d6b92ecd9d6943f8a25e86a350','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:10:31','2026-10-24 09:30:38'),(281,83,'550c06d0996d346f9b0a2d20462f5d55fd0dcf35040f345c940dd90c57be2a5f','2026-10-31 09:30:38','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:30:38','2026-10-24 09:48:24'),(282,83,'87de3aef14531e8312a7a9c54cfc39ccd0c942d5f59561ae98ae9d2cb33fe3cc','2026-10-31 09:30:38','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:30:38','2026-10-24 09:48:24'),(283,83,'9c41f41933dd66202586829d7044cd9b438a76e9d96167c632be221f2cfb90d0','2026-10-31 09:30:38','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:30:38','2026-10-24 09:48:24'),(284,83,'40ae6eaa365c48d5d4373f7f61845af5e12eb7d6b92ecd9d6943f8a25e86a350','2026-10-31 09:30:38','2026-10-24 09:48:24','7f9eadff1e5c27b53e3167b76f1c9910c048b6cbb769249deebbf393d6a061b4','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:30:38','2026-10-24 09:48:24'),(285,83,'5f753b0936ecd2b8ebf29482ca4191d606dd34f709250cb89c335da35c5adbe4','2026-10-31 09:48:24','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:48:24','2026-10-24 09:48:24'),(286,83,'dee39fdc0f9ff817bf6a4f13928599ca3cf08311cebdb76e8c277f4a34c329b8','2026-10-31 09:48:24','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:48:24','2026-10-24 09:48:24'),(287,83,'7f9eadff1e5c27b53e3167b76f1c9910c048b6cbb769249deebbf393d6a061b4','2026-10-31 09:48:24','2026-10-24 09:48:24',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:48:24','2026-10-24 09:48:24'),(288,83,'c7949433ba6b552d018eff068a9d080e2ac8fefbed2909791a7ca99cd7ee14a4','2026-10-31 09:49:05','2026-10-24 09:56:58',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 09:49:05','2026-10-24 09:56:58'),(289,403,'f48685e22dc940a8c3f6f336ea7d6ee0ee0c0f0b35532cf8805089aff4fd339e','2026-10-31 09:58:05','2026-10-24 10:12:58',NULL,NULL,NULL,'2026-10-24 09:58:05','2026-10-24 10:12:58'),(290,83,'7f704567b6a137f28d4410b068f133c424070f5b223a2011bcd0775f154cc325','2026-10-31 10:13:10','2026-10-24 10:33:29','763fd85775e78f54153744421ad1cb855acd36f9f419742d41d608f2856f3618','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:13:10','2026-10-24 10:33:29'),(291,83,'04d73950b4b770040cf8d7b837bdcc92789bdd16651ef3a674f6de6a1b767ebb','2026-10-31 10:33:29','2026-10-24 11:06:57',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:33:29','2026-10-24 11:06:57'),(292,83,'82aee9b64bce0de59657ef060df0d15dd39d7826d1eecdb10c7ebb9228189163','2026-10-31 10:33:29','2026-10-24 11:06:57',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:33:29','2026-10-24 11:06:57'),(293,83,'79303d35ee1bac1688152d5a8fe385e4d40ca4f01e770ff9c466d245bbbe86a6','2026-10-31 10:33:29','2026-10-24 11:06:57',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:33:29','2026-10-24 11:06:57'),(294,83,'763fd85775e78f54153744421ad1cb855acd36f9f419742d41d608f2856f3618','2026-10-31 10:33:29','2026-10-24 10:49:11','6a22572a04add817fca7847580590eeee97cb04486ed72deef390b1b1b63a888','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:33:29','2026-10-24 10:49:11'),(304,83,'59177103c90245601d5c813bc9536b9e781ae5fb9f7df9515a389010e21c58d2','2026-10-31 10:49:11','2026-10-24 11:06:57',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:49:11','2026-10-24 11:06:57'),(305,83,'6a22572a04add817fca7847580590eeee97cb04486ed72deef390b1b1b63a888','2026-10-31 10:49:11','2026-10-24 11:06:57','8d971f0154b056d0123b232a3d38b319cf58f5863a906d3b541c581745b53083','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 10:49:11','2026-10-24 11:06:57'),(306,83,'8d971f0154b056d0123b232a3d38b319cf58f5863a906d3b541c581745b53083','2026-10-31 11:06:57','2026-10-24 11:23:14','caaff37abb892f1b47e93fd3e53354d4918212f1e2c49fcbdb9db09bae1ef43e','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 11:06:57','2026-10-24 11:23:14'),(307,83,'caaff37abb892f1b47e93fd3e53354d4918212f1e2c49fcbdb9db09bae1ef43e','2026-10-31 11:23:14','2026-10-24 11:38:21','e4fa7debbbcff8f9bcbf500632e2c7dd6bf9f7be5981011b86f820550e84cee5','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 11:23:14','2026-10-24 11:38:21'),(308,83,'e25b07639610863e901e2828edcdc6eefcb7b265baa663617f257fb6bed2c27c','2026-10-31 11:38:21','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 11:38:21','2026-10-29 08:34:14'),(309,83,'95d8b595d7b9a550c07539102f2e29fe429148c362217a5ccc2bdb218ea239c6','2026-10-31 11:38:21','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 11:38:21','2026-10-29 08:34:14'),(310,83,'0ef1b3b1c76ea97122bba1a1437a3c8ed6b3733851b46353619333feec4410af','2026-10-31 11:38:22','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 11:38:22','2026-10-29 08:34:14'),(311,83,'e4fa7debbbcff8f9bcbf500632e2c7dd6bf9f7be5981011b86f820550e84cee5','2026-10-31 11:38:22','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 11:38:22','2026-10-29 08:34:14'),(312,20,'55d8a4a84c62fb6a66fd57353cb4663525b46c4bc369f31c461a5b82a1330022','2026-11-04 11:36:50','2026-10-28 11:40:27',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 11:36:50','2026-10-28 11:40:27'),(313,83,'a47db808abd89528b5c853b8dcf4a95a62e88a7971c7d36f3d654d54cb9b76a9','2026-11-04 11:40:40','2026-10-28 11:55:58','d2d5ce2d8f3f8752eadfc96683f62863d7edb8684a2d58bfe0c9acbb7a1a0e02','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 11:40:40','2026-10-28 11:55:58'),(314,20,'c28a4a161fac8847fe351b1fbfd9cf9a48a010e9829a978287d3ee34ebba230e','2026-11-04 11:43:18','2026-10-28 12:02:34','b1601910290a3e95cd9294a988b016e90cf32146edd942c17cf5984b764a356e','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 11:43:18','2026-10-28 12:02:34'),(315,83,'9ab17a7c9e3e206a97089271647d8f085ab479e6e60d4e8c2768f83e1f896974','2026-11-04 11:55:58','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 11:55:58','2026-10-29 08:34:14'),(316,83,'d2d5ce2d8f3f8752eadfc96683f62863d7edb8684a2d58bfe0c9acbb7a1a0e02','2026-11-04 11:55:58','2026-10-28 12:15:15','18e14eb610e8967fb329540eef4ec6e85a15bd0f75c9addfd748340ba8f97882','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 11:55:58','2026-10-28 12:15:15'),(317,20,'48d978bf686f8e83a73db841aeb08cd8b3203ea5e99d3427ef661fcde9b955a3','2026-11-04 12:02:34',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 12:02:34','2026-10-28 12:02:34'),(318,20,'834f0119783f50b82254cdb2d3e0a72b4453c69bba078a087543a92b7f7713ee','2026-11-04 12:02:34',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 12:02:34','2026-10-28 12:02:34'),(319,20,'2897bbf10a55b834bf29c630e77444f534a40d4f42c3e42ac6bc8df4cb599221','2026-11-04 12:02:34','2026-10-28 13:57:15','c09765621e45e1b05976287007f55772cdb5fb18fde0778742b1dc10fb717769','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 12:02:34','2026-10-28 13:57:15'),(320,20,'b1601910290a3e95cd9294a988b016e90cf32146edd942c17cf5984b764a356e','2026-11-04 12:02:34',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 12:02:34','2026-10-28 12:02:34'),(321,83,'4ea71e64288b516394ee3b2c3dece4865f99ccfa21fecd1f5a6ce7a954ed6cb1','2026-11-04 12:15:15','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 12:15:15','2026-10-29 08:34:14'),(322,83,'18e14eb610e8967fb329540eef4ec6e85a15bd0f75c9addfd748340ba8f97882','2026-11-04 12:15:15','2026-10-28 16:00:31','ec320fed5a0ea38bb44e7f2ec4de703363a6667374e6be29610aa44f67824f0d','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 12:15:15','2026-10-28 16:00:31'),(323,20,'7620b3dc5b1abb87b4cb85c10261cf87042b921be85f2202a5bac0ffa91bd58b','2026-11-04 13:57:15',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 13:57:15','2026-10-28 13:57:15'),(324,20,'c09765621e45e1b05976287007f55772cdb5fb18fde0778742b1dc10fb717769','2026-11-04 13:57:15',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 13:57:15','2026-10-28 13:57:15'),(325,83,'ec320fed5a0ea38bb44e7f2ec4de703363a6667374e6be29610aa44f67824f0d','2026-11-04 16:00:31','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 16:00:31','2026-10-29 08:34:14'),(326,83,'9be2af426862207ccf614c5ec332c1e79c3e6e3c0de7bf7ba002a79f9a0fc1ff','2026-11-04 16:00:31','2026-10-29 04:49:31','5853dd6c7882527a370e620c7eb6b653d2c8817b0d9e42c8c391ce139f786a1b','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-28 16:00:31','2026-10-29 04:49:31'),(327,83,'ca0816c7533a958042635510f24995b5a1211bf1702d5b60e6c9510665b1ea97','2026-11-05 04:49:31','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 04:49:31','2026-10-29 08:34:14'),(328,83,'5853dd6c7882527a370e620c7eb6b653d2c8817b0d9e42c8c391ce139f786a1b','2026-11-05 04:49:31','2026-10-29 08:34:14','d555be152987ef2904c5355f8d9089b3f83dd4630dbb200093edad6dca19f4d5','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 04:49:31','2026-10-29 08:34:14'),(329,83,'329bfb89f65e564b7008e5e1fcce209b32396f4bdad4fc961e8d9805b8d2fd6b','2026-11-05 06:34:43','2026-10-29 07:55:51','c532826f2086cedc19a6227b2a4d203a430ca763069ead9cb64a19b6740dba94','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 06:34:43','2026-10-29 07:55:51'),(330,83,'107daf9ab3a547abb4e6f2ec0215ea1be2db887a0804b72a9c966b484d1ad342','2026-11-05 08:34:03','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 08:34:03','2026-10-29 08:34:14'),(331,83,'c532826f2086cedc19a6227b2a4d203a430ca763069ead9cb64a19b6740dba94','2026-11-05 08:34:03','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 08:34:03','2026-10-29 08:34:14'),(332,83,'d555be152987ef2904c5355f8d9089b3f83dd4630dbb200093edad6dca19f4d5','2026-11-05 08:34:14','2026-10-29 08:34:14',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 08:34:14','2026-10-29 08:34:14'),(333,20,'390cebd14f39724564e4140ae5f20e54f559b525a761aeb6203767d536ee7727','2026-11-05 09:20:40',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 09:20:40','2026-10-29 09:20:40'),(334,20,'3192950cba640cec61cfc6aa874901d6c5aed529b495f45aededdf6beb2762ce','2026-11-05 09:21:44','2026-10-29 10:04:21','c99a5486e7421cbb98cea5808e3ac2d55392b480662954b5cc323f4694fb0404','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 09:21:44','2026-10-29 10:04:21'),(344,20,'cdbd50ed83fb6535aa290455f4e7f5f17f820d53ffe1e91dd523dbd8b6e4ac50','2026-11-05 10:04:21',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 10:04:21','2026-10-29 10:04:21'),(345,20,'c99a5486e7421cbb98cea5808e3ac2d55392b480662954b5cc323f4694fb0404','2026-11-05 10:04:21','2026-10-29 10:57:32','519808b33e0b7ff9b58f053c8ca7929ed0119cdd2cbabb83e0d2adbde0b94f33','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 10:04:21','2026-10-29 10:57:32'),(346,20,'59d35f993ac1b499bba433e3f1033a8afc7592bb24dcca37d53e13069c043e50','2026-11-05 10:57:32',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 10:57:32','2026-10-29 10:57:32'),(347,20,'519808b33e0b7ff9b58f053c8ca7929ed0119cdd2cbabb83e0d2adbde0b94f33','2026-11-05 10:57:32','2026-10-29 11:31:19','1e287bea97ae73a25907b139522d761e4090713bd21a30eb3422355f43a6eab1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-29 10:57:32','2026-10-29 11:31:19'),(357,20,'1e287bea97ae73a25907b139522d761e4090713bd21a30eb3422355f43a6eab1','2026-11-05 11:31:19',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','127.0.0.1','2026-10-29 11:31:19','2026-10-29 11:31:19'),(358,20,'7f75f42d8de665ca6244647f172392d39fcbe32f5fdc495422bcef94322f2b35','2026-11-05 11:31:19',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','127.0.0.1','2026-10-29 11:31:19','2026-10-29 11:31:19'),(359,491,'57d7bc14e42437eec9b822a334abfb37e4aa9cfb5f8cd6cf2b903be43847eddf','2026-11-05 11:55:39','2026-10-29 11:55:40','646cc902b2097020feee130df0062adfa2582362f2c486429aee4f1c6e11fce5',NULL,NULL,'2026-10-29 11:55:39','2026-10-29 11:55:40'),(360,492,'e6369df362b2098b093065a1dc4e1ff226fb478b460147d85d0ae0025a422ed6','2026-11-05 11:55:39',NULL,NULL,NULL,NULL,'2026-10-29 11:55:39','2026-10-29 11:55:39'),(361,491,'0bbae1601a6d685f469f20a5a0c9e44a0e7feef03768caf95db4799463cf9e41','2026-11-05 11:55:39','2026-10-29 11:55:40',NULL,'node','::1','2026-10-29 11:55:39','2026-10-29 11:55:40'),(362,491,'e6af918fc30a550be932c8b449b748be42bd48759295923679e2cefbe3308e0a','2026-11-05 11:55:39','2026-10-29 11:55:40',NULL,'node','::1','2026-10-29 11:55:39','2026-10-29 11:55:40'),(363,491,'646cc902b2097020feee130df0062adfa2582362f2c486429aee4f1c6e11fce5','2026-11-05 11:55:40','2026-10-29 11:55:40',NULL,'node','::1','2026-10-29 11:55:40','2026-10-29 11:55:40'),(364,491,'03970e2a46c2f8d064de208bbc289aa196858593c208393b381be42f0f0a5593','2026-11-05 11:55:40','2026-10-29 11:55:40',NULL,'node','::1','2026-10-29 11:55:40','2026-10-29 11:55:40'),(365,491,'eed970231c0784a028244f66d9b4bca279c4e6908361ece6320a3079964671fc','2026-11-05 11:55:40',NULL,NULL,'node','::1','2026-10-29 11:55:40','2026-10-29 11:55:40'),(366,494,'53f9ca8e6054dfe4d70060cc12c4f82111251d744469a3c229cc87b158579627','2026-11-05 11:55:42',NULL,NULL,'node','::1','2026-10-29 11:55:42','2026-10-29 11:55:42'),(367,499,'ac1eceafca0360921d64e50579ad0e7e01604b00fb34956f6fb4f6ed3df8d3b1','2026-11-05 11:55:44',NULL,NULL,NULL,NULL,'2026-10-29 11:55:44','2026-10-29 11:55:44');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refunds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `refund_number` varchar(50) NOT NULL,
  `order_id` bigint(20) unsigned NOT NULL,
  `order_item_id` bigint(20) unsigned DEFAULT NULL,
  `payment_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `vendor_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `vendor_balance_deducted` decimal(12,2) NOT NULL DEFAULT 0.00,
  `commission_reversed` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reason` text NOT NULL,
  `status` enum('requested','approved','rejected','refunded') NOT NULL DEFAULT 'requested',
  `rejection_reason` text DEFAULT NULL,
  `gateway_refund_id` varchar(100) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `refund_number` (`refund_number`),
  KEY `order_item_id` (`order_item_id`),
  KEY `payment_id` (`payment_id`),
  KEY `refunds_order_id_idx` (`order_id`),
  KEY `refunds_vendor_id_idx` (`vendor_id`),
  KEY `refunds_user_id_idx` (`user_id`),
  KEY `refunds_status_idx` (`status`),
  CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `refunds_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `refunds_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `refunds_ibfk_5` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
INSERT INTO `refunds` VALUES (1,'REF-20261024-7325',1,1,1,442,170,4000.00,3600.00,400.00,'Defective audio channel','refunded',NULL,'RFD_GATEWAY_123','2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-24 11:48:09');
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_payouts`
--

DROP TABLE IF EXISTS `seller_payouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_payouts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payout_number` varchar(50) NOT NULL,
  `vendor_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payout_method` enum('bank_transfer','upi','manual') NOT NULL DEFAULT 'bank_transfer',
  `account_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`account_details`)),
  `status` enum('pending','approved','rejected','processing') NOT NULL DEFAULT 'pending',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payout_number` (`payout_number`),
  KEY `seller_payouts_vendor_id_idx` (`vendor_id`),
  KEY `seller_payouts_status_idx` (`status`),
  KEY `seller_payouts_payout_number_idx` (`payout_number`),
  CONSTRAINT `seller_payouts_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_payouts`
--

LOCK TABLES `seller_payouts` WRITE;
/*!40000 ALTER TABLE `seller_payouts` DISABLE KEYS */;
INSERT INTO `seller_payouts` VALUES (1,'PAY-20261024-8117',170,1500.00,'bank_transfer','{\"bank\":\"HDFC\",\"ifsc\":\"HDFC0001\",\"ac\":\"123456789\"}','approved','UTR99887766',NULL,'NEFT transferred','2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-24 11:48:09'),(2,'PAY-20261024-8000',170,1000.00,'upi','{\"bank_name\":null,\"bank_account_name\":null,\"bank_account_number\":null,\"bank_ifsc_code\":null}','rejected',NULL,'Incorrect UPI ID provided',NULL,'2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-24 11:48:09','2026-10-24 11:48:09'),(3,'PAY-20261029-4197',172,2000.00,'bank_transfer','{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\"}','pending',NULL,NULL,NULL,'2026-10-29 06:04:48',NULL,'2026-10-29 06:04:48','2026-10-29 06:04:48'),(4,'PAY-20261029-8175',172,2000.00,'bank_transfer','{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\"}','approved','TXN-SETTLE-1793254012407',NULL,NULL,'2026-10-29 06:06:52','2026-10-29 06:06:52','2026-10-29 06:06:52','2026-10-29 06:06:52'),(5,'PAY-20261029-9634',172,2000.00,'bank_transfer','{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\"}','approved','TXN-SETTLE-1793265962303',NULL,NULL,'2026-10-29 09:26:02','2026-10-29 09:26:02','2026-10-29 09:26:02','2026-10-29 09:26:02'),(6,'PAY-20261029-8057',172,2000.00,'bank_transfer','{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\"}','approved','TXN-SETTLE-1793265983392',NULL,NULL,'2026-10-29 09:26:23','2026-10-29 09:26:23','2026-10-29 09:26:23','2026-10-29 09:26:23'),(7,'PAY-20261029-7031',172,2000.00,'bank_transfer','{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\"}','approved','TXN-SETTLE-1793272494514',NULL,NULL,'2026-10-29 11:14:54','2026-10-29 11:14:54','2026-10-29 11:14:54','2026-10-29 11:14:54'),(8,'PAY-20261029-6761',172,2000.00,'bank_transfer','{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\"}','approved','TXN-SETTLE-1793275032933',NULL,NULL,'2026-10-29 11:57:12','2026-10-29 11:57:12','2026-10-29 11:57:12','2026-10-29 11:57:12');
/*!40000 ALTER TABLE `seller_payouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
INSERT INTO `sequelizemeta` VALUES ('20261017000001-create-users-table.js'),('20261017000002-create-refresh-tokens-table.js'),('20261017000003-create-password-reset-tokens-table.js'),('20261019000001-create-addresses-table.js'),('20261019000002-add-avatar-to-users.js'),('20261019000003-create-vendors-table.js'),('20261019000004-create-categories-table.js'),('20261023000001-create-products-table.js'),('20261024000001-create-carts-and-cart-items-tables.js'),('20261024000002-create-wishlists-table.js'),('20261024000003-create-inventory-and-stock-management.js'),('20261024000004-create-banners-and-settings-tables.js'),('20261024000005-add-category-id-to-banners.js'),('20261024000006-create-financial-and-orders-tables.js'),('20261028000001-enhance-commissions-and-vendor-earnings.js');
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `group` varchar(50) NOT NULL DEFAULT 'general',
  `description` varchar(255) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `settings_group_idx` (`group`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'site_name','Bada Vyapaar Marketplace','branding','Dynamic store site name',1,'2026-10-24 10:30:28','2026-10-24 10:30:28'),(2,'site_tagline','Leading Hyperlocal Multivendor Portal','branding','Dynamic store site tagline',1,'2026-10-24 10:30:28','2026-10-24 10:30:28'),(3,'site_logo','https://multivendor.com/assets/dynamic-logo.svg','branding','Dynamic store site logo',1,'2026-10-24 10:30:28','2026-10-24 10:30:28'),(4,'site_dark_logo','https://multivendor.com/assets/dynamic-logo-dark.svg','branding','Dynamic store site dark logo',1,'2026-10-24 10:30:28','2026-10-24 10:30:28'),(5,'site_favicon','https://multivendor.com/assets/dynamic-favicon.ico','branding','Dynamic store site favicon',1,'2026-10-24 10:30:28','2026-10-24 10:30:28'),(6,'contact_email','hello@badavyapaar.com','branding','Dynamic store contact email',1,'2026-10-24 10:30:28','2026-10-24 10:30:28'),(7,'contact_phone','+91 99999 88888','branding','Dynamic store contact phone',1,'2026-10-24 10:30:28','2026-10-24 10:30:28');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','vendor','customer') NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `users_role_idx` (`role`),
  KEY `users_status_idx` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=525 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (16,'Demo Customer','democustomer@example.com','9123456789',NULL,'$2b$10$BTjxW1qo.lkvYBdj63tQpeP8PWENa2Mj2a0iONC4h/TmplMZwqrpm','customer','active',0,'2026-10-19 06:00:37','2026-10-24 06:00:44'),(20,'Akshay kumar','admin@gmail.com','+911234345456',NULL,'$2b$10$BTjxW1qo.lkvYBdj63tQpeP8PWENa2Mj2a0iONC4h/TmplMZwqrpm','admin','active',0,'2026-10-19 06:03:15','2026-10-24 06:00:44'),(58,'aman mshra','aman@example.com','9876543216',NULL,'$2b$10$Xv.8Ei0SvC0NsNoEsFdaEupikjSj.oBCFQTPUzcMsE7qSDoz3i5yC','customer','active',0,'2026-10-19 07:27:22','2026-10-19 07:27:22'),(83,'swati','swati@example.com','9876543218',NULL,'$2b$10$BTjxW1qo.lkvYBdj63tQpeP8PWENa2Mj2a0iONC4h/TmplMZwqrpm','admin','active',0,'2026-10-23 07:30:41','2026-10-24 06:00:44'),(332,'swati','swati07@gmail.com','9876543219',NULL,'$2b$10$sX0Fvd/0mvtF5UPu7VVUOOPn/zBGrcWzJ73HCgF3Dju/uxuEPhdPK','vendor','active',0,'2026-10-24 05:16:24','2026-10-24 05:16:24'),(365,'John Doe','john2@example.com',NULL,NULL,'$2b$10$O1u1XM20Ow4MsJs57VHy2efVrr8hkZxOap.BYzigEP7Tlg6o/.DdK','customer','active',0,'2026-10-24 05:48:23','2026-10-24 05:48:23'),(403,'ruchi','ruchi@gmail.com','1234567898',NULL,'$2b$10$TMsCD89cvBDHfDfgLcVFOuxBiR6AwK4eL7vlXSukIfHwW/maSBDYy','vendor','active',0,'2026-10-24 09:58:05','2026-10-24 09:58:05'),(442,'Finance Test Customer','fin_test_customer@example.com',NULL,NULL,'$2b$10$abcdefghijklmnopqrstuv','customer','active',0,'2026-10-24 11:46:43','2026-10-24 11:46:43'),(443,'Finance Test Vendor','fin_test_vendor@example.com',NULL,NULL,'$2b$10$abcdefghijklmnopqrstuv','vendor','active',0,'2026-10-24 11:46:43','2026-10-24 11:46:43'),(444,'Super Admin','comm_admin@test.com',NULL,NULL,'$2b$10$uVbDbG3zxLeVYlCOgz44hOFhWy7VY1qxBRu8BJxUYhCMh7nxpf7G6','admin','active',0,'2026-10-29 06:03:45','2026-10-29 06:03:45'),(445,'John Buyer','comm_customer@test.com',NULL,NULL,'$2b$10$uVbDbG3zxLeVYlCOgz44hOFhWy7VY1qxBRu8BJxUYhCMh7nxpf7G6','customer','active',0,'2026-10-29 06:03:45','2026-10-29 06:03:45'),(446,'Vendor One','comm_vendor1@test.com',NULL,NULL,'$2b$10$uVbDbG3zxLeVYlCOgz44hOFhWy7VY1qxBRu8BJxUYhCMh7nxpf7G6','vendor','active',0,'2026-10-29 06:03:45','2026-10-29 06:03:45'),(447,'Vendor Two','comm_vendor2@test.com',NULL,NULL,'$2b$10$t/PWgarXsCIdsOpEGy4pw.we1TEydTTmEBbi/bkB4dQQNnhzNgBeu','vendor','active',0,'2026-10-29 06:04:15','2026-10-29 06:04:15'),(491,'Test Customer','testuser@example.com','9876543210',NULL,'$2b$10$Q3A57xo25fp71Us7hpez6uKRPPnR4ZfNf6rBXTjMo5W5Hm9EcsgK.','customer','active',0,'2026-10-29 11:55:39','2026-10-29 11:55:40'),(492,'Hacker Admin','admin_attempt@example.com','9876543299',NULL,'$2b$10$ZMyMPlGC536QfTdHGtQ7w.Gb0yrWpO5y8tch4hDQvbRMGuTtE9c1S','customer','active',0,'2026-10-29 11:55:39','2026-10-29 11:55:39'),(493,'Blocked User','blockeduser@example.com',NULL,NULL,'$2b$10$tCVjMkQnhcDJDzzDgWXwzOvT2D86svmPB6APHoP5vSoRwJ2Pa78LW','customer','blocked',1,'2026-10-29 11:55:40','2026-10-29 11:55:40'),(494,'User One Updated','profile_test1@example.com',NULL,'https://images.unsplash.com/photo-user.jpg','$2b$10$QLV66.KU8DEEqTqL4YetZ.iwSGz07aV/5mHzRfV3qSniBdEpxYAui','customer','active',1,'2026-10-29 11:55:41','2026-10-29 11:55:42'),(495,'User Two','profile_test2@example.com','9822222222',NULL,'$2b$10$L/kGkT5mOMtOFAFmLgQKlefJbNYT.e02.j2joXe0mLU9o0qdi7UMK','customer','active',1,'2026-10-29 11:55:41','2026-10-29 11:55:41'),(496,'Customer Seller Applicant','vendor_test_cust@example.com','9899000001',NULL,'$2b$10$fB5BF9yUPWVmGcxHJUEUVODLdclm2rJR9qd11bb2t.yiZV1MKYKPK','vendor','active',1,'2026-10-29 11:55:43','2026-10-29 11:55:44'),(497,'Customer Two','vendor_test_cust2@example.com','9899000002',NULL,'$2b$10$17S3tnNgvg8SMVkA/ugs1.dAFy.sM48McDgtfZWjhUQm99TfJxIaC','customer','active',1,'2026-10-29 11:55:44','2026-10-29 11:55:44'),(498,'Super Admin','vendor_test_admin@example.com','9899000009',NULL,'$2b$10$BbA21qMZMGkmmmM8pd02VuRfDIRBKceau5sDvRY6zQXwCI0UnQu0y','admin','active',1,'2026-10-29 11:55:44','2026-10-29 11:55:44'),(499,'Direct Seller','vendor_test_direct@example.com','9899000005',NULL,'$2b$10$DpvoIS6OuH2F8TriU2ngtuDWVmIYKY4Up./mAsvjMxLVeXCt2uMri','vendor','active',0,'2026-10-29 11:55:44','2026-10-29 11:55:44'),(523,'Banner Test Admin','banner_test_admin@example.com',NULL,NULL,'$2b$10$fsNWl74Vot4/FF4tcmvD0umlB9ZE/YtFlQKTkzVUgabFJiW54aHlG','admin','active',0,'2026-10-29 11:57:00','2026-10-29 11:57:00'),(524,'Banner Test Customer','banner_test_cust@example.com',NULL,NULL,'$2b$10$5amsyglmF0CmQ1/BmJPMhejiAFd1OObmgzIgTdpfM5KZKpo3kJyue','customer','active',0,'2026-10-29 11:57:00','2026-10-29 11:57:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `store_name` varchar(150) NOT NULL,
  `store_slug` varchar(191) NOT NULL,
  `store_email` varchar(191) DEFAULT NULL,
  `store_phone` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'India',
  `logo_url` varchar(255) DEFAULT NULL,
  `banner_url` varchar(255) DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `bank_account_name` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_ifsc_code` varchar(20) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 10.00,
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `wallet_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_withdrawn` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `store_slug` (`store_slug`),
  UNIQUE KEY `vendors_user_id_unique` (`user_id`),
  UNIQUE KEY `vendors_store_slug_unique` (`store_slug`),
  KEY `vendors_status_idx` (`status`),
  KEY `vendors_created_at_idx` (`created_at`),
  CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (119,332,'Swati Grocery & Fresh Mart','swati-grocery-fresh-mart','swati07@gmail.com','9876543219',NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,10.00,'approved',NULL,NULL,'2026-10-24 05:16:24','2026-10-24 05:23:52',0.00,0.00),(154,403,'ruchi','ruchi','ruchi@gmail.com','1234567898',NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,10.00,'pending',NULL,NULL,'2026-10-24 09:58:05','2026-10-24 09:58:05',0.00,0.00),(170,443,'Apex Electronics Store','apex-electronics-store',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,10.00,'approved',NULL,NULL,'2026-10-24 11:46:43','2026-10-24 11:48:09',-1500.00,1500.00),(171,446,'Premium Electronics Store','premium-electronics-store-test','store1@test.com',NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,15.00,'approved',NULL,NULL,'2026-10-29 06:04:15','2026-10-29 11:57:12',0.00,0.00),(172,447,'Standard Books Store','standard-books-store-test','store2@test.com',NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,10.00,'approved',NULL,NULL,'2026-10-29 06:04:15','2026-10-29 11:57:12',3000.00,2000.00),(190,496,'Tech Haven Store','tech-haven-store',NULL,NULL,'Updated store description with new arrivals',NULL,'Pune','Maharashtra','400001','India',NULL,NULL,'27AABCU9603R1ZM',NULL,NULL,NULL,'HDFC Bank',8.50,'approved',NULL,'2026-10-29 11:55:44','2026-10-29 11:55:44','2026-10-29 11:55:44',0.00,0.00),(191,499,'Direct Electronics Hub','direct-electronics-hub','vendor_test_direct@example.com','9899000005',NULL,NULL,'Delhi',NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,10.00,'rejected','Incomplete business documents provided.',NULL,'2026-10-29 11:55:44','2026-10-29 11:55:44',0.00,0.00);
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wishlists` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_wishlist_product` (`user_id`,`product_id`),
  KEY `idx_wishlists_user_id` (`user_id`),
  KEY `idx_wishlists_product_id` (`product_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29 18:33:57
