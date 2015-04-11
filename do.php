<?php
/**
 * web - do.php
 * Created by LKHO.
 * Date: 8/4/2015
 */

require_once 'db.php';
$action = isset($_GET['action']) ? strtolower($_GET['action']) : null;

switch ($action) {
    case 'login':

        $result = db::query("SELECT id, pw FROM [users] WHERE id = '" . db::escape($_POST['uid']) . "'");
        $row = $result->fetch_row();
        if ($_POST['pw'] === $row[1]) {
            session_start();
            $_SESSION = array('uid' => $row[0]);
            header('HTTP/1.1 303 See Other');
            header('Location: ./');
        } else {
            header('HTTP/1.1 403 Unauthorized');
            echo 'Wrong user id or password';
        }
        break;

    case 'logout':

        session_start();
        $_SESSION = array();
        session_destroy();
        header('HTTP/1.1 302 Found');
        header('Location: ./');
        break;

    case 'info':

        session_start();
        if (isset($_SESSION['uid'])) {
            $result = db::query("SELECT id, name, deposit FROM [users] WHERE id = '" . db::escape($_SESSION['uid']) . "'");
            $row = $result->fetch_assoc();
            if ($row) {
                header('content-type: application/json');
                echo json_encode(array(
                                     'info_user'    => $row['id'] . ' ' . $row['name'],
                                     'info_balance' => floatval($row['deposit']),
                                     'info_today'   => date('j F, Y (l)')
                                 ));
                break;
            }
        }
        header('HTTP/1.1 403 Unauthorized');
        echo 'Session expired. Please log in again.';

        break;

    case 'list':

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

        $result = db::query("SELECT time, venue, court FROM [bookings]
                             WHERE activity = '" . db::escape($activity) . "'
                               AND time > now()");
        $booked = array();
        while ($row = $result->fetch_row())
            $booked["{$row[0]}|{$row[1]}|{$row[2]}"] = true;

        foreach ($venues as $venue => &$courts) {
            foreach ($dates as $date) {
                foreach ($times as $time) {
                    for ($court = 1; $court <= 10; $court++) {
                        $c = $prefix . sprintf('%02d', $court);
                        if (!isset($booked["$date $time:00|$venue|$c"]))
                            $courts[$date][$time][] = $c;
                    }
                }
            }
        }

        header('content-type: application/json');
        echo json_encode(array(
                             'dates'  => $dates,
                             'times'  => $times,
                             'venues' => $venues
                         ));
        break;

    default:
        header('HTTP/1.1 400 Bad Request');
        echo 'Unknown action';
}