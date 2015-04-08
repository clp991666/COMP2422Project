<?php
/**
 * web - do.php
 * Created by LKHO.
 * Date: 8/4/2015
 */

$action = isset($_GET['action']) ? strtolower($_GET['action']) : null;
switch ($action) {
    case 'list':
        require_once 'db.php';
        $activity = @$_GET['activity'];
        if (!$activity) {
            header('http/1.1 400 Bad Request');
            echo 'Missing field';
            break;
        }

        $prefix = strtoupper(substr($activity, 0, 1));


        $today = strtotime('today');
        $dates = array();
        $times = array();
        $venues = array('Shaw Sports Complex' => array(), 'Kwong On' => array(), 'Students Hall' => array());

        for ($i = 1; $i <= 7; $i++) {
            $d = $today + $i * 24 * 60 * 60;
            if (date('N', $d) > 5) continue;
            $dates[] = date('Y-m-d', $d);
        }
        for ($h = 8; $h <= 21; $h++) {
            $dt = $today + $h * 60 * 60 + 30 * 60;
            $times[] = date('H:i', $dt);
        }

//        $result = db::query('SELECT * FROM `' . config::$db_prefix . 'bookings` WHERE time > now()');
        foreach ($venues as $venue => &$courts) {

            foreach ($dates as $date) {

                foreach ($times as $time) {

                    for ($court = 1; $court <= 10; $court++) {
                        $courts[$date][$time][] = $prefix . sprintf('%02d', $court);
                    }

                }

            }

        }

        $out = array(
            'dates'  => $dates,
            'times'  => $times,
            'venues' => $venues
        );
        header('content-type: application/json');
        echo json_encode($out);
        break;
    default:
        header('HTTP/1.1 400 Bad Request');
        echo 'Unknown action';
}