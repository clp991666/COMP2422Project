CREATE TABLE `bookings` (
  `user` varchar(20) NOT NULL,
  `time` datetime NOT NULL,
  `activity` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `court` varchar(255) NOT NULL,
  PRIMARY KEY (`time`,`activity`,`venue`,`court`),
  KEY `IX_time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
