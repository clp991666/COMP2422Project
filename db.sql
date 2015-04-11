CREATE TABLE `bookings` (
  `user` varchar(20) NOT NULL,
  `time` datetime NOT NULL,
  `activity` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `court` varchar(255) NOT NULL,
  PRIMARY KEY (`time`,`activity`,`venue`,`court`),
  KEY `IX_time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `users` (
  `id` varchar(20) NOT NULL,
  `pw` varchar(255) default NULL,
  `name` varchar(255) default NULL,
  `deposit` decimal(10,2) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
