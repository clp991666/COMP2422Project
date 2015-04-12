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
            header('HTTP/1.1 303 See Other');
            header('Location: login.html?err=' . urlencode('Wrong user id or password.'));
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
                        if (!isset($booked["$date $time:00|$venue|$c"])) {
                            $a = date_parse($time);
                            $courts[$date][$time][] = array('court' => $c, 'fee' => $a['hour'] < 11 ? 0 : 10);
                        }
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

    case 'book':

        session_start();
        if (isset($_SESSION['uid'])) {

            $selection = json_decode($_POST['selection'], true);
            db::autocommit(false);

            $query = db::prepare("INSERT INTO [bookings] (user, time, activity, venue, court, fee) VALUES (?,?,?,?,?,?)");
            $err = array();
            $totalfee = 0;
            foreach ($selection as $item) {
                $fee = date_parse($item['time']);
                $fee = $fee['hour'] < 11 ? 0 : 10;
                $totalfee += $fee;
                $query->bind_param('sssssi',
                                   $_SESSION['uid'],
                                   $temp = $item['date'] . ' ' . $item['time'],
                                   $item['activity'],
                                   $item['venue'],
                                   $item['court'],
                                   $fee);
                if (!$query->execute()) {
                    if ($query->errno == 1062) {
                        $err[] = $item;
                    } else {
                        $err = $query->error;
                        break;
                    }
                }
            }

            if (is_array($err) && count($err) > 0) {
                db::rollback();
                header('HTTP/1.1 409 Conflict');
                echo "Some time slots have been booked by others:\n\n";
                foreach ($err as $item)
                    echo "{$item['date']} {$item['time']}\n{$item['activity']} {$item['venue']} {$item['court']}\n";
                echo "\nChanges have NOT been applied, please submit again.";
            } else if (is_string($err)) {
                db::rollback();
                header('HTTP/1.1 500 Internal Server Error');
                echo "Database return:\n\n$err";
            } else {
                $u = db::escape($_SESSION['uid']);
                $result = db::query("SELECT deposit FROM [users] WHERE id = '$u'")->fetch_row();
                if ($result[0] - $totalfee < 0) {
                    db::rollback();
                    header('HTTP/1.1 409 Conflict');
                    echo "You do not have enough deposit.";
                } else {
                    $query = db::prepare("UPDATE [users] SET deposit = deposit - $totalfee WHERE id = '$u'");
                    if (!$query->execute()) {
                        db::rollback();
                        header('HTTP/1.1 500 Internal Server Error');
                        echo "Database return:\n\n" . $query->error;
                    } else {
                        db::commit();
                    }
                }
            }
        } else {
            header('HTTP/1.1 403 Unauthorized');
            echo 'Session expired. Please log in again.';
        }

        break;

    case 'booked':

        session_start();
        if (isset($_SESSION['uid'])) {
            $result = db::query("SELECT time, activity, venue, court FROM [bookings]
                                 WHERE user = '" . db::escape($_SESSION['uid']) . "'
                                   AND time >= now()
                                 ORDER BY time DESC");
            $arr = array();
            while ($row = $result->fetch_assoc()) {
                $time = strtotime($row['time']);
                $row['date'] = date('Y-m-d', $time);
                $row['time'] = date('H:i', $time);
                $row['time1'] = date('H:i', $time + 60 * 60);
                $arr[] = $row;
            }
            header('content-type: application/json');
            echo json_encode($arr);
        } else {
            header('HTTP/1.1 403 Unauthorized');
            echo 'Session expired. Please log in again.';
        }
        break;

    case 'cancel':

        session_start();
        if (isset($_SESSION['uid'])) {
            $b = $_POST['booking'];
            db::autocommit(false);
            $result = db::query("SELECT fee FROM [bookings]
                                 WHERE user = '" . db::escape($_SESSION['uid']) . "'
                                   AND time = '" . db::escape($b['date'] . ' ' . $b['time']) . ":00'
                                   AND activity = '" . db::escape($b['activity']) . "'
                                   AND venue = '" . db::escape($b['venue']) . "'
                                   AND court = '" . db::escape($b['court']) . "'");
            if (!$result || $result->num_rows == 0) {
                header('HTTP/1.1 404 Not Found');
                echo 'Cannot find record.';
                break;
            }
            $fee = $result->fetch_row();
            $fee = $fee[0];
            $result = db::query("DELETE FROM [bookings]
                                 WHERE user = '" . db::escape($_SESSION['uid']) . "'
                                   AND time = '" . db::escape($b['date'] . ' ' . $b['time']) . ":00'
                                   AND activity = '" . db::escape($b['activity']) . "'
                                   AND venue = '" . db::escape($b['venue']) . "'
                                   AND court = '" . db::escape($b['court']) . "'");
            if ($result && db::$mysqli->affected_rows > 0) {
                if (!db::query("UPDATE [users] SET deposit = deposit + $fee WHERE id = '" . db::escape($_SESSION['uid']) . "'")) {
                    db::rollback();
                    header('HTTP/1.1 500 Internal Server Error');
                    echo db::$mysqli->error;
                    break;
                }
                db::commit();
            }
        } else {
            header('HTTP/1.1 403 Unauthorized');
            echo 'Session expired. Please log in again.';
        }
        break;

    case 'transfer':

        session_start();
        if (isset($_SESSION['uid'])) {
            $b = $_POST['booking'];

            $result = db::query("UPDATE [bookings] SET user = '" . db::escape($_POST['to']) . "'
                                 WHERE time = '" . db::escape($b['date'] . ' ' . $b['time']) . ":00'
                                   AND activity = '" . db::escape($b['activity']) . "'
                                   AND venue = '" . db::escape($b['venue']) . "'
                                   AND court = '" . db::escape($b['court']) . "'");
            if ($result && db::$mysqli->affected_rows > 0) {
            } else if ($result && db::$mysqli->affected_rows == 0) {
                header('HTTP/1.1 400 Bad Request');
                echo "Cannot transfer to yourself.";
                break;
            } else if (db::$mysqli->errno == 1452) {
                header('HTTP/1.1 400 Bad Request');
                echo "'{$_POST['to']}' is not a valid ID.";
                break;
            }
        } else {
            header('HTTP/1.1 403 Unauthorized');
            echo 'Session expired. Please log in again.';
        }
        break;

    default:
        header('HTTP/1.1 400 Bad Request');
        echo 'Unknown action';
}