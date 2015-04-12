CREATE TABLE `bookings` (
  `user` varchar(20) NOT NULL,
  `time` datetime NOT NULL,
  `activity` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `court` varchar(255) NOT NULL,
  `fee` decimal(10,2) NOT NULL default 0,
  PRIMARY KEY  (`time`,`activity`,`venue`,`court`),
  KEY `IX_time` (`time`),
  KEY `FK_users_idx` (`user`),
  CONSTRAINT `FK_users` FOREIGN KEY (`user`) REFERENCES `comp2422_users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `users` (
  `id` varchar(20) NOT NULL,
  `pw` varchar(255) default NULL,
  `name` varchar(255) default NULL,
  `deposit` decimal(10,2) NOT NULL default 0,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
